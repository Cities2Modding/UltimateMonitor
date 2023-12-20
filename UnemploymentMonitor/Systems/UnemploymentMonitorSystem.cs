using Game.Citizens;
using Game.Common;
using Game.Tools;
using Game;
using Unity.Burst.Intrinsics;
using Unity.Burst;
using Unity.Collections;
using Unity.Entities;
using UnityEngine.Scripting;
using BepInEx.Logging;
using System.Runtime.CompilerServices;
using Game.Simulation;
using UnemploymentMonitor.ComponentTypes;

namespace UnemploymentMonitor.Systems
{
    public class UnemploymentMonitorSystem : GameSystemBase
    {
        private EntityQuery m_CreatedGroup;
        ManualLogSource logger = new ManualLogSource("UnderemploymentSystem");


        [BurstCompile]
        private struct CalculateUnderemploymentJob : IJobChunk
        {
            public EntityTypeHandle m_EntityType;
            public ComponentTypeHandle<Worker> m_WorkerType;
            public ComponentTypeHandle<Citizen> m_CitizenType;

            [ReadOnly]
            public ComponentLookup<Worker> m_Workers;
            [ReadOnly]
            public ComponentLookup<Citizen> m_Citizens;
            public ComponentLookup<UnderemployedWorker> m_UnderemployedWorkers;

            [ReadOnly]
            public SharedComponentTypeHandle<UpdateFrame> m_UpdateFrameType;
            public uint m_UpdateFrameIndex;
            public EntityCommandBuffer.ParallelWriter m_CommandBuffer;

            public void Execute(in ArchetypeChunk chunk, int unfilteredChunkIndex, bool useEnabledMask, in v128 chunkEnabledMask)
            {
                if (chunk.GetSharedComponent(m_UpdateFrameType).m_Index != m_UpdateFrameIndex)
                {
                    return;
                }

                NativeArray<Entity> entities = chunk.GetNativeArray(m_EntityType);
                NativeArray<Worker> workers = chunk.GetNativeArray(ref m_WorkerType);
                NativeArray<Citizen> citizens = chunk.GetNativeArray(ref m_CitizenType);

                for (int i = 0; i < entities.Length; i++)
                {
                    Entity entity = entities[i];
                    Worker worker = workers[i];
                    Citizen citizen = citizens[i];

                    if (citizen.GetEducationLevel() > worker.m_Level)
                    {
                        m_CommandBuffer.AddComponent(unfilteredChunkIndex, entity, new UnderemployedWorker
                        {
                            m_EducationLevel = citizen.GetEducationLevel(),
                            m_JobLevel = worker.m_Level
                        });
                    }
                    else if (m_UnderemployedWorkers.HasComponent(entity))
                    {
                        m_CommandBuffer.RemoveComponent<UnderemployedWorker>(unfilteredChunkIndex, entity);
                    }
                }
            }

            void IJobChunk.Execute(in ArchetypeChunk chunk, int unfilteredChunkIndex, bool useEnabledMask, in v128 chunkEnabledMask)
            {
                Execute(in chunk, unfilteredChunkIndex, useEnabledMask, in chunkEnabledMask);
            }
        }

        private struct TypeHandle
        {
            public EntityTypeHandle __Unity_Entities_Entity_TypeHandle;
            [ReadOnly]
            public ComponentTypeHandle<Citizen> __Game_Citizens_Citizen_RO_ComponentTypeHandle;
            [ReadOnly]
            public ComponentTypeHandle<Worker> __Game_Citizens_Worker_RO_ComponentTypeHandle;

            [ReadOnly]
            public ComponentLookup<Worker> __Game_Citizens_Worker_RO_ComponentLookup;
            [ReadOnly]
            public ComponentLookup<Citizen> __Game_Citizens_Citizen_RO_ComponentLookup;

            public ComponentLookup<UnderemployedWorker> __UnemploymentMonitor_UnderemployedWorker_RW_ComponentLookup;
            public SharedComponentTypeHandle<UpdateFrame> __Game_Simulation_UpdateFrame_SharedComponentTypeHandle;

            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            public void __AssignHandles(ref SystemState state)
            {
                //TypeHandles
                __Unity_Entities_Entity_TypeHandle = state.GetEntityTypeHandle();
                __Game_Citizens_Citizen_RO_ComponentTypeHandle = state.GetComponentTypeHandle<Citizen>(isReadOnly: true);
                __Game_Citizens_Worker_RO_ComponentTypeHandle = state.GetComponentTypeHandle<Worker>(isReadOnly: true);

                //ComponentLookups
                __Game_Citizens_Worker_RO_ComponentLookup = state.GetComponentLookup<Worker>(isReadOnly: true);
                __Game_Citizens_Citizen_RO_ComponentLookup = state.GetComponentLookup<Citizen>(isReadOnly: true);
                __UnemploymentMonitor_UnderemployedWorker_RW_ComponentLookup = state.GetComponentLookup<UnderemployedWorker>(isReadOnly: false);

                //UpdateFrame
                __Game_Simulation_UpdateFrame_SharedComponentTypeHandle = state.GetSharedComponentTypeHandle<UpdateFrame>();
            }
        }

        public int GetUnderemployedCount()
        {
            int count = 0;

            EntityQueryDesc underemployedWorkersQueryDesc = new EntityQueryDesc
            {
                All = new ComponentType[1]
                {
                    ComponentType.ReadOnly<UnderemployedWorker>()
                },
                None = new ComponentType[3]
                {
                    ComponentType.ReadOnly<Deleted>(),
                    ComponentType.ReadOnly<Destroyed>(),
                    ComponentType.ReadOnly<Temp>()
                }
            };

            EntityQuery m_EntityQuery = GetEntityQuery(underemployedWorkersQueryDesc);

            count = m_EntityQuery.CalculateEntityCount();

            return count;
        }

        public static readonly int kUpdatesPerDay = 16;
        private EndFrameBarrier m_EndFrameBarrier;
        private SimulationSystem m_SimulationSystem;
        private TypeHandle __TypeHandle;

        public override int GetUpdateInterval(SystemUpdatePhase phase)
        {
            return 262144 / (kUpdatesPerDay * 16);
        }

        [Preserve]
        protected override void OnCreate()
        {
            base.OnCreate();

            Logger.Sources.Add(logger);

            m_EndFrameBarrier = World.GetOrCreateSystemManaged<EndFrameBarrier>();
            m_SimulationSystem = World.GetOrCreateSystemManaged<SimulationSystem>();

            EntityQueryDesc employeesQueryDesc = new EntityQueryDesc
            {
                All = new ComponentType[2] {
                    ComponentType.ReadOnly<Worker>(),
                    ComponentType.ReadOnly<Citizen>()
                },
                None = new ComponentType[3]
                {
                    ComponentType.ReadOnly<Deleted>(),
                    ComponentType.ReadOnly<Destroyed>(),
                    ComponentType.ReadOnly<Temp>()
                }
            };

            m_CreatedGroup = GetEntityQuery(employeesQueryDesc);
            RequireForUpdate(m_CreatedGroup);
        }

        protected override void OnCreateForCompiler()
        {
            base.OnCreateForCompiler();
            __AssignQueries(ref CheckedStateRef);
            __TypeHandle.__AssignHandles(ref CheckedStateRef);
        }

        [Preserve]
        protected override void OnUpdate()
        {
            uint updateFrame = SimulationUtils.GetUpdateFrame(m_SimulationSystem.frameIndex, kUpdatesPerDay, 16);
            __TypeHandle.__Game_Citizens_Citizen_RO_ComponentLookup.Update(ref CheckedStateRef);
            __TypeHandle.__Game_Citizens_Worker_RO_ComponentLookup.Update(ref CheckedStateRef);
            __TypeHandle.__UnemploymentMonitor_UnderemployedWorker_RW_ComponentLookup.Update(ref CheckedStateRef);
            __TypeHandle.__Unity_Entities_Entity_TypeHandle.Update(ref CheckedStateRef);

            CalculateUnderemploymentJob jobData = default;
            jobData.m_Citizens = __TypeHandle.__Game_Citizens_Citizen_RO_ComponentLookup;
            jobData.m_Workers = __TypeHandle.__Game_Citizens_Worker_RO_ComponentLookup;
            jobData.m_EntityType = __TypeHandle.__Unity_Entities_Entity_TypeHandle;
            jobData.m_CitizenType = __TypeHandle.__Game_Citizens_Citizen_RO_ComponentTypeHandle;
            jobData.m_WorkerType = __TypeHandle.__Game_Citizens_Worker_RO_ComponentTypeHandle;
            jobData.m_UnderemployedWorkers = __TypeHandle.__UnemploymentMonitor_UnderemployedWorker_RW_ComponentLookup;
            jobData.m_CommandBuffer = m_EndFrameBarrier.CreateCommandBuffer().AsParallelWriter();
            jobData.m_UpdateFrameIndex = updateFrame;
            jobData.m_UpdateFrameType = __TypeHandle.__Game_Simulation_UpdateFrame_SharedComponentTypeHandle;
            Dependency = jobData.ScheduleParallel(m_CreatedGroup, Dependency);
        }

        [Preserve]
        protected override void OnDestroy()
        {
            base.OnDestroy();
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private void __AssignQueries(ref SystemState state)
        {
        }

        [Preserve]
        public UnemploymentMonitorSystem()
        {

        }
    }
}

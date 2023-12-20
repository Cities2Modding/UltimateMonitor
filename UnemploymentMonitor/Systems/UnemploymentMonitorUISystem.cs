using Colossal.UI.Binding;
using Game.Citizens;
using Game.Common;
using Game.Companies;
using Game.SceneFlow;
using Game.Simulation;
using Game.Tools;
using Game.UI;
using UnemploymentMonitor.Configuration;
using Unity.Collections;
using Unity.Entities;
using Unity.Jobs;
using UnityEngine;
using UnityEngine.Scripting;

namespace UnemploymentMonitor.Systems
{
    public class UnemploymentMonitorUISystem : UISystemBase
    {
        private const string kGroup = "unemploymentInfo";

        private CountEmploymentSystem m_CountEmploymentSystem;
        private UnemploymentMonitorSystem m_UnderemploymentSystem;

        NativeArray<int> m_Results = new NativeArray<int>( 5, Allocator.Persistent );
        EntityQuery m_HomelessHouseholdQuery;
        EntityQuery m_EmployeesQuery;

        private readonly UnemploymentMonitorConfig _config = UnemploymentMonitorConfig.Load( );
        private bool hasReloaded = false;

        [Preserve]
        protected override void OnCreate( )
        {
            m_CountEmploymentSystem = base.World.GetOrCreateSystemManaged<CountEmploymentSystem>( );
            m_UnderemploymentSystem = base.World.GetOrCreateSystemManaged<UnemploymentMonitorSystem>( );

            base.OnCreate( );

            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "unemploymentTotal", ( ) => m_CountEmploymentSystem.GetUnemployment( out JobHandle deps ).value ) );

            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "unemploymentEducation0", ( ) => m_CountEmploymentSystem.GetUnemploymentByEducation( out JobHandle deps )[0] ) );
            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "unemploymentEducation1", ( ) => m_CountEmploymentSystem.GetUnemploymentByEducation( out JobHandle deps )[1] ) );
            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "unemploymentEducation2", ( ) => m_CountEmploymentSystem.GetUnemploymentByEducation( out JobHandle deps )[2] ) );
            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "unemploymentEducation3", ( ) => m_CountEmploymentSystem.GetUnemploymentByEducation( out JobHandle deps )[3] ) );
            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "unemploymentEducation4", ( ) => m_CountEmploymentSystem.GetUnemploymentByEducation( out JobHandle deps )[4] ) );

            AddUpdateBinding( new GetterValueBinding<Vector2>( "unemploymentInfo", "windowPos", ( ) => ( Vector2 ) new Vector2( ( float ) _config.X, ( float ) _config.Y ) ) );
            

            AddBinding( new TriggerBinding<double, double>( "unemploymentInfo", "updateWindow", ( x, y ) =>
            {
                _config.Save( );
            } ) );


            AddBinding( new TriggerBinding( "unemploymentInfo", "saveConfig", () =>
            {
                _config.Save( );
            } ) );


            EntityQueryDesc homelessHouseholdsQueryDesc = new EntityQueryDesc
            {
                All = new ComponentType[2]
                {
                    ComponentType.ReadOnly<Household>(),
                    ComponentType.ReadOnly<HomelessHousehold>()
                },
                None = new ComponentType[5]
                {
                    ComponentType.ReadOnly<Deleted>(),
                    ComponentType.ReadOnly<Destroyed>(),
                    ComponentType.ReadOnly<Temp>(),
                    ComponentType.ReadOnly<TouristHousehold>(),
                    ComponentType.ReadOnly<CommuterHousehold>()
                }
            };

            EntityQueryDesc underemployedEmployeesQueryDesc = new EntityQueryDesc
            {
                All = new ComponentType[2] {
                    ComponentType.ReadOnly<Employee>(),
                    ComponentType.ReadOnly<Worker>()
                },
                None = new ComponentType[3]
                {
                    ComponentType.ReadOnly<Deleted>(),
                    ComponentType.ReadOnly<Destroyed>(),
                    ComponentType.ReadOnly<Temp>()
                }
            };

            m_HomelessHouseholdQuery = GetEntityQuery( homelessHouseholdsQueryDesc );
            m_EmployeesQuery = GetEntityQuery( underemployedEmployeesQueryDesc );

            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "homelessHouseholdCount", ( ) => m_HomelessHouseholdQuery.CalculateEntityCount( ) ) );
            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "underemployedCimsCount", ( ) => m_UnderemploymentSystem.GetUnderemployedCount( ) ) );
        }

        [Preserve]
        protected override void OnDestroy( )
        {
            m_Results.Dispose( );
            base.OnDestroy( );
        }
    }


}

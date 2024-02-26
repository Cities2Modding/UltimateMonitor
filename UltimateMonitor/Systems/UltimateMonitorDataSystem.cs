using Colossal.Collections;
using Game;
using Game.Common;
using Game.Companies;
using Game.Simulation;
using Game.Tools;
using System.Reflection;
using UltimateMonitor.Data;
using Unity.Entities;

namespace UltimateMonitor.Systems
{
    public class UltimateMonitorDataSystem : GameSystemBase
    {
        public MonitoringData Data
        {
            get
            {
                return _data;
            }
        }

        private MonitoringData _data = new MonitoringData( );

        static FieldInfo m_Unemployed = typeof( CountEmploymentSystem ).GetField( "m_Unemployed", BindingFlags.NonPublic | BindingFlags.Instance );
        static FieldInfo m_Adults = typeof( CountEmploymentSystem ).GetField( "m_Adults", BindingFlags.NonPublic | BindingFlags.Instance );

        private float _lastResultTick;

        private EntityQuery _homelessHouseholdsQuery;
        private EntityQuery _employeesQuery;
        private CountEmploymentSystem _countEmploymentSystem;
        private UnemploymentMonitorSystem _unemploymentSystem;

        protected override void OnCreate( )
        {
            base.OnCreate( );

            _countEmploymentSystem = World.GetOrCreateSystemManaged<CountEmploymentSystem>( );
            _unemploymentSystem = World.GetOrCreateSystemManaged<UnemploymentMonitorSystem>( );

            BuildEntityQueries( );
        }

        protected override void OnUpdate( )
        {            
            if ( UnityEngine.Time.time >= _lastResultTick + 1f )
            {
                _lastResultTick = UnityEngine.Time.time;

                UpdateData( );
            }
        }

        private void BuildEntityQueries( )
        {
            var homelessHouseholdsQueryDesc = new EntityQueryDesc
            {
                All =
                [
                    ComponentType.ReadOnly<Game.Citizens.Household>( ),
                    ComponentType.ReadOnly<Game.Citizens.HomelessHousehold>( )
                ],
                None =
                [
                    ComponentType.ReadOnly<Deleted>( ),
                    ComponentType.ReadOnly<Destroyed>( ),
                    ComponentType.ReadOnly<Temp>( ),
                    ComponentType.ReadOnly<Game.Citizens.TouristHousehold>( ),
                    ComponentType.ReadOnly<Game.Citizens.CommuterHousehold>( )
                ]
            };

            var underemployedEmployeesQueryDesc = new EntityQueryDesc
            {
                All = [
                    ComponentType.ReadOnly<Employee>( ),
                    ComponentType.ReadOnly<Game.Citizens.Worker>( )
                ],
                None =
                [
                    ComponentType.ReadOnly<Deleted>( ),
                    ComponentType.ReadOnly<Destroyed>( ),
                    ComponentType.ReadOnly<Temp>( )
                ]
            };

            _homelessHouseholdsQuery = GetEntityQuery( homelessHouseholdsQueryDesc );
            _employeesQuery = GetEntityQuery( underemployedEmployeesQueryDesc );
        }

        private void UpdateData( )
        {
            _data.HomelessHouseholds = _homelessHouseholdsQuery.CalculateEntityCount( );
            _data.UnderEmployed = _unemploymentSystem.GetUnderemployedCount( );
            _data.Employable = ( ( NativeValue<int> ) m_Adults.GetValue( _countEmploymentSystem ) ).value;
            _data.Unemployed = ( ( NativeValue<int> ) m_Unemployed.GetValue( _countEmploymentSystem ) ).value;
        }
    }
}

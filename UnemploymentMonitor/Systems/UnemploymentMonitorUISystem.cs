using Colossal;
using Colossal.Collections;
using Colossal.UI.Binding;
using Game;
using Game.Citizens;
using Game.Common;
using Game.Companies;
using Game.Prefabs;
using Game.SceneFlow;
using Game.Simulation;
using Game.Tools;
using Game.UI;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using UnemploymentMonitor.Configuration;
using Unity.Collections;
using Unity.Entities;
using Unity.Jobs;
using UnityEngine;
using UnityEngine.InputSystem;
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

        static FieldInfo m_Unemployed = typeof( CountEmploymentSystem ).GetField( "m_Unemployed", BindingFlags.NonPublic | BindingFlags.Instance );
        static FieldInfo m_Adults = typeof( CountEmploymentSystem ).GetField( "m_Adults", BindingFlags.NonPublic | BindingFlags.Instance );

        private MonitoringData _currentData = new MonitoringData( );
        private MonitoringData _difference = new MonitoringData( );

        private float _lastResultClear;
        private float _lastResultTick;
        private List<MonitoringData> _results = new List<MonitoringData>( 60 );

        private bool hasNeverCapturedAverage = true;

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
                _config.X = ( decimal ) x;
                _config.Y = ( decimal ) y;
            } ) );


            AddBinding( new TriggerBinding( "unemploymentInfo", "saveConfig", ( ) =>
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

            AddUpdateBinding( new GetterValueBinding<string>( "unemploymentInfo", "homelessHouseholds", ( ) => GetValueString( _currentData.HomelessHouseholds ) ) );
            AddUpdateBinding( new GetterValueBinding<string>( "unemploymentInfo", "underEmployed", ( ) => GetValueString( _currentData.UnderEmployed ) ) );
            AddUpdateBinding( new GetterValueBinding<string>( "unemploymentInfo", "employable", ( ) => GetValueString( _currentData.Employable ) ) );
            AddUpdateBinding( new GetterValueBinding<string>( "unemploymentInfo", "unemployed", ( ) => GetValueString( _currentData.Unemployed ) ) );

            AddUpdateBinding( new GetterValueBinding<string>( "unemploymentInfo", "homelessHouseholdsDiff", ( ) => GetDiffString( _difference.HomelessHouseholds ) ) );
            AddUpdateBinding( new GetterValueBinding<string>( "unemploymentInfo", "underEmployedDiff", ( ) => GetDiffString( _difference.UnderEmployed ) ) );
            AddUpdateBinding( new GetterValueBinding<string>( "unemploymentInfo", "employableDiff", ( ) => GetDiffString( _difference.Employable ) ) );
            AddUpdateBinding( new GetterValueBinding<string>( "unemploymentInfo", "unemployedDiff", ( ) => GetDiffString( _difference.Unemployed ) ) );

            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "homelessHouseholdsVector", ( ) => GetValueVector( _difference.HomelessHouseholds ) ) );
            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "underEmployedVector", ( ) => GetValueVector( _difference.UnderEmployed ) ) );
            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "employableVector", ( ) => GetValueVector( _difference.Employable ) ) );
            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "unemployedVector", ( ) => GetValueVector( _difference.Unemployed ) ) );

            var inputAction = new InputAction( "UnemploymentMonitor_Toggle" );
            inputAction.AddCompositeBinding( "ButtonWithOneModifier" )
                .With( "Modifier", "<Keyboard>/shift" )
                .With( "Button", "<Keyboard>/e" );
            inputAction.performed += ( a ) =>
            {
                GameManager.instance.userInterface.view.View.ExecuteScript( @"window.dispatchEvent(new CustomEvent(""hookui"", { detail: { type: ""toggle_visibility"", id: ""cities2modding.unemploymentmonitor""}}));" );
            };
            inputAction.Enable( );
        }

        private void Capture( )
        {
            _currentData.HomelessHouseholds = m_HomelessHouseholdQuery.CalculateEntityCount( );
            _currentData.UnderEmployed = m_UnderemploymentSystem.GetUnderemployedCount( );
            _currentData.Employable = ( ( NativeValue<int> ) m_Adults.GetValue( m_CountEmploymentSystem ) ).value;
            _currentData.Unemployed = ( ( NativeValue<int> ) m_Unemployed.GetValue( m_CountEmploymentSystem ) ).value;
        }

        protected override void OnUpdate( )
        {
            base.OnUpdate( );

            if ( !gameMode.IsGame( ) )
                return;

            if ( hasNeverCapturedAverage )
            {
                hasNeverCapturedAverage = false;
                Capture( );
                _difference = new MonitoringData();
            }

            if ( UnityEngine.Time.time >= _lastResultTick + 1f )
            {
                _lastResultTick = UnityEngine.Time.time;

                var lastCapture = _currentData;
                Capture( );
                _results.Add( CalculateDiff( _currentData, lastCapture ) );

                if ( UnityEngine.Time.time >= _lastResultClear + 15f )
                {
                    _lastResultClear = UnityEngine.Time.time;

                    _difference = new MonitoringData
                    {
                        HomelessHouseholds = _results.Sum( r => r.HomelessHouseholds ),
                        UnderEmployed = _results.Sum( r => r.UnderEmployed ),
                        Employable = _results.Sum( r => r.Employable ),
                        Unemployed = _results.Sum( r => r.Unemployed )
                    };

                    _results.Clear( );
                }
            }
        }

        private MonitoringData CalculateDiff( MonitoringData a, MonitoringData b )
        {
            return new MonitoringData
            {
                HomelessHouseholds = a.HomelessHouseholds - b.HomelessHouseholds,
                Employable = a.Employable - b.Employable,
                UnderEmployed = a.UnderEmployed - b.UnderEmployed,
                Unemployed = a.Unemployed - b.Unemployed,
            };
        }

        private int GetValueVector( int diff )
        {
            return diff > 0 ? 1 : diff < 0 ? -1 : 0;
        }

        private string GetDiffString( int diff )
        {
            if ( diff == 0 )
                return string.Empty;

            var stringVal = $"{diff:N0}";

            if ( diff >= 1_000_000 )
                stringVal = $"{diff / 1_000_000:N0}m";
            if ( diff >= 1_000 )
                stringVal = $"{diff / 1_000:N0}k";

            return diff > 0 ? $"+{stringVal}" : $"{stringVal}";
        }

        private string GetValueString( int value )
        {
            if ( value == 0 )
                return string.Empty;

            var stringVal = $"{value:N0}";

            if ( value >= 1_000_000 )
            {
                var newVal = value / 1_000_000m;
                stringVal = $"{( newVal == ( ( int ) newVal ) ? newVal.ToString( ) : $"{newVal:N1}" )}m";
            }
            else if ( value >= 1_000 )
            {
                var newVal = value / 1_000m;
                stringVal = $"{( newVal == ( ( int ) newVal ) ? newVal.ToString( ) : $"{newVal:N1}" )}k";
            }

            return stringVal;
        }

        [Preserve]
        protected override void OnDestroy( )
        {
            m_Results.Dispose( );
            base.OnDestroy( );
        }
    }

    public struct MonitoringData
    {
        public int HomelessHouseholds
        {
            get;
            set;
        }

        public int UnderEmployed
        {
            get;
            set;
        }

        public int Employable
        {
            get;
            set;
        }

        public int Unemployed
        {
            get;
            set;
        }
    }

}

using Colossal.UI.Binding;
using Game;
using Game.Simulation;
using Gooee.Plugins;
using Gooee.Plugins.Attributes;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using UltimateMonitor.Configuration;
using UltimateMonitor.Systems;
using Unity.Entities;

namespace UltimateMonitor.UI
{
    [ControllerDepends( SystemUpdatePhase.GameSimulation, typeof( UnemploymentMonitorSystem ) )]
    [ControllerDepends( SystemUpdatePhase.GameSimulation, typeof( UltimateMonitorDataSystem ) )]
    public class UltimateMonitorController : Controller<UltimateMonitorViewModel>
    {        
        public readonly static UltimateMonitorConfig _config = UltimateMonitorConfig.Load( );

        private CountEmploymentSystem _countEmploymentSystem;
        private UltimateMonitorDataSystem _dataSystem;

        public override UltimateMonitorViewModel Configure( )
        {
            _countEmploymentSystem = World.GetOrCreateSystemManaged<CountEmploymentSystem>( );
            _dataSystem = World.GetOrCreateSystemManaged<UltimateMonitorDataSystem>( );

            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "unemploymentEducation0", ( ) => _countEmploymentSystem.GetUnemploymentByEducation( out _ )[0] ) );
            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "unemploymentEducation1", ( ) => _countEmploymentSystem.GetUnemploymentByEducation( out _ )[1] ) );
            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "unemploymentEducation2", ( ) => _countEmploymentSystem.GetUnemploymentByEducation( out _ )[2] ) );
            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "unemploymentEducation3", ( ) => _countEmploymentSystem.GetUnemploymentByEducation( out _ )[3] ) );
            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "unemploymentEducation4", ( ) => _countEmploymentSystem.GetUnemploymentByEducation( out _ )[4] ) );

            AddUnemploymentBindings( );

            var model = new UltimateMonitorViewModel( );

            model.Items = 
            [
                new MonitorItem
                {
                    Name = "Electricity",
                    Icon = "Media/Game/Icons/Electricity.svg",
                    Colour = "#FFB80E",
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["electricityInfo.electricityAvailability"]
                },
                new MonitorItem
                {
                    Name = "Water",
                    Icon = "Media/Game/Icons/Water.svg",
                    Colour = "#39C2FF",
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["waterInfo.waterAvailability"]
                },
                new MonitorItem
                {
                    Name = "Sewage",
                    Icon = "Media/Game/Icons/Sewage.svg",
                    Colour = "#997E62",
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["waterInfo.sewageAvailability"]
                },
                new MonitorItem
                {
                    Name = "Garbage",
                    Icon = "Media/Game/Icons/Garbage.svg",
                    Colour = "#31CF00",
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["garbageInfo.processingAvailability"]
                },
                new MonitorItem
                {
                    Name = "FireHazard",
                    Icon = "Media/Game/Icons/FireSafety.svg",
                    Colour = "GreenToRed",
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["fireAndRescueInfo.averageFireHazard"]
                },
                new MonitorItem
                {
                    Name = "CrimeRate",
                    Icon = "Media/Game/Notifications/CrimeScene.svg",
                    Colour = "#255D95",
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["policeInfo.averageCrimeProbability"]
                },
                new MonitorItem
                {
                    Name = "TrafficFlow",
                    Icon = "Media/Game/Icons/TrafficLights.svg",
                    Colour = "#808080",
                    ValueOperation = ValueOperation.Custom,
                    ValueSubscriptions = ["trafficInfo.trafficFlow"],
                },
                new MonitorItem
                {
                    Name = "ParkingAvailability",
                    Icon = "Media/Game/Icons/Parking.svg",
                    Colour = "#808080",
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["roadsInfo.parkingAvailability"]
                },

                // Unemployment Monitor
                new MonitorItem
                {
                    Name = "Unemployment",
                    Icon = "Media/Game/Icons/Workers.svg",
                    Colour = "#a06d6a",
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["populationInfo.unemployment"]
                },
                new MonitorItem
                {
                    Name = "UnemploymentUneducated",
                    Icon = "Media/Game/Icons/Uneducated.svg",
                    Colour = "#966aa0",
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["unemploymentInfo.unemploymentEducation0"]
                },
                new MonitorItem
                {
                    Name = "UnemploymentPoorlyEducated",
                    Icon = "Media/Game/Icons/PoorlyEducated.svg",
                    Colour = "#796aa0",
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["unemploymentInfo.unemploymentEducation1"]
                },
                new MonitorItem
                {
                    Name = "UnemploymentEducated",
                    Icon = "Media/Game/Icons/Educated.svg",
                    Colour = "#6a79a0",
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["unemploymentInfo.unemploymentEducation2"]
                },
                new MonitorItem
                {
                    Name = "UnemploymentWellEducated",
                    Icon = "Media/Game/Icons/WellEducated.svg",
                    Colour = "#6a9da0",
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["unemploymentInfo.unemploymentEducation3"]
                },
                new MonitorItem
                {
                    Name = "UnemploymentHighlyEducated",
                    Icon = "Media/Game/Icons/HighlyEducated.svg",
                    Colour = "#6aa078",
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["unemploymentInfo.unemploymentEducation4"]
                },

                // Calculated values

                new MonitorItem
                {
                    Name = "HealthcareEfficiency",
                    Icon = "Media/Game/Icons/Healthcare.svg",
                    Colour = "#E56333",
                    ValueOperation = ValueOperation.Average,
                    ValueSubscriptions = ["healthcareInfo.healthcareAvailability", "healthcareInfo.averageHealth"]
                },
                new MonitorItem
                {
                    Name = "DeathcareEfficiency",
                    Icon = "Media/Game/Icons/Deathcare.svg",
                    Colour = "#797979",
                    ValueOperation = ValueOperation.Average,
                    ValueSubscriptions = ["healthcareInfo.cemeteryAvailability", "healthcareInfo.deathcareAvailability"]
                },
                new MonitorItem
                {
                    Name = "ImprisonmentCapacity",
                    Icon = "Media/Game/Icons/Police.svg",
                    Colour = "#FFB80E",
                    ValueOperation = ValueOperation.Average,
                    ValueSubscriptions = ["policeInfo.jailAvailability", "policeInfo.prisonAvailability"]
                },
                new MonitorItem
                {
                    Name = "EducationAvailability",
                    Icon = "Media/Game/Icons/Education.svg",
                    Colour = "#61819C",
                    ValueOperation = ValueOperation.Average,
                    ValueSubscriptions = ["educationInfo.elementaryAvailability", "educationInfo.highSchoolAvailability", "educationInfo.collegeAvailability", "educationInfo.universityAvailability"]
                },
                new MonitorItem
                {
                    Name = "IncomeEfficiency",
                    Icon = "Media/Game/Icons/Money.svg",
                    Colour = "#9ADF4B",
                    ValueOperation = ValueOperation.Custom,
                    ValueSubscriptions = ["budget.totalIncome", "budget.totalExpenses"]
                },
                new MonitorItem
                {
                    Name = "MonthlyPopulationGrowth",
                    Icon = "Media/Game/Icons/Population.svg",
                    Colour = "#97B4BE",
                    ValueOperation = ValueOperation.Custom,
                    ValueSubscriptions = ["populationInfo.population", "populationInfo.birthRate", "populationInfo.movedIn", "populationInfo.deathRate", "populationInfo.movedAway"]
                },
                new MonitorItem
                {
                    Name = "AveragePollution",
                    Icon = "Media/Game/Icons/GroundPollution.svg",
                    Colour = "#9D662E",
                    ValueOperation = ValueOperation.Average,
                    ValueSubscriptions = ["pollutionInfo.averageGroundPollution", "pollutionInfo.averageWaterPollution", "pollutionInfo.averageAirPollution", "pollutionInfo.averageNoisePollution"]
                },


                // Raw Values
                new MonitorItem
                {
                    Name = "HomelessHouseholds",
                    Icon = "Media/Game/Icons/NoMoney.svg",
                    Colour = "#d8903e",
                    Type = MonitorItemType.Raw,
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["unemploymentInfo.homelessHouseholds"]
                },
                new MonitorItem
                {
                    Name = "UnderEmployed",
                    Icon = "Media/Game/Icons/Household.svg",
                    Colour = "#b5b05e",
                    Type = MonitorItemType.Raw,
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["unemploymentInfo.underEmployed"]
                },
                new MonitorItem
                {
                    Name = "Employable",
                    Icon = "Media/Game/Icons/Neutral.svg",
                    Colour = "#5eb57b",
                    Type = MonitorItemType.Raw,
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["unemploymentInfo.employable"]
                },
                new MonitorItem
                {
                    Name = "Unemployed",
                    Icon = "Media/Game/Icons/Sad.svg",
                    Colour = "#b55e5e",
                    Type = MonitorItemType.Raw,
                    ValueOperation = ValueOperation.None,
                    ValueSubscriptions = ["unemploymentInfo.unemployed"]
                },
            ];

            var configWindows = _config.Windows;

            model.Windows = configWindows == null ? [
                new MonitorWindow
                {
                    Name = "Default",
                    Monitors = []
                }
            ] : _config.Windows;

            return model;
        }


        private void AddUnemploymentBindings( )
        {
            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "homelessHouseholds", ( ) => _dataSystem.Data.HomelessHouseholds ) );
            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "underEmployed", ( ) => _dataSystem.Data.UnderEmployed ) );
            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "employable", ( ) => _dataSystem.Data.Employable ) );
            AddUpdateBinding( new GetterValueBinding<int>( "unemploymentInfo", "unemployed", ( ) => _dataSystem.Data.Unemployed ) );
        }

        [OnTrigger]
        private void OnAddMonitor( string json )
        {
            if ( string.IsNullOrEmpty( json ) )
                return;

            var payload = JsonConvert.DeserializeObject<Dictionary<string, object>>( json );

            if ( payload == null )
                return;

            var windowName = ( string ) payload["WindowName"];
            var monitorName = ( string ) payload["MonitorName"];

            var window = Model.Windows.FirstOrDefault( w => w.Name == windowName );

            if ( window == null )
                return;

            var monitorItem = Model.Items.FirstOrDefault( i => i.Name == monitorName );

            if ( monitorItem == null )
                return;

            var monitors = window.Monitors ?? [];

            if ( monitors.Count( m => m.MonitorItemName == monitorName ) > 0 )
                return;

            monitors.Add( new MonitorWindowDisplay { MonitorItemName = monitorItem.Name, Order = monitors.Count } );

            window.Monitors = monitors;

            TriggerUpdate( );
        }


        [OnTrigger]
        private void OnRemoveMonitor( string json )
        {
            if ( string.IsNullOrEmpty( json ) )
                return;

            var payload = JsonConvert.DeserializeObject<Dictionary<string, object>>( json );

            if ( payload == null )
                return;

            var windowName = ( string ) payload["WindowName"];
            var monitorName = ( string ) payload["MonitorName"];

            var window = Model.Windows.FirstOrDefault( w => w.Name == windowName );

            if ( window == null || window.Monitors == null )
                return;

            var monitorItem = Model.Items.FirstOrDefault( i => i.Name == monitorName );

            if ( monitorItem == null )
                return;

            var monitors = window.Monitors;

            if ( monitors == null || monitors.Count( m => m.MonitorItemName == monitorName ) == 0 )
                return;

            monitors.RemoveAll( m => m.MonitorItemName == monitorName );

            // Re-order the monitors
            var i = 0;
            foreach ( var monitor in monitors.OrderBy( m => m.Order ) )
            {
                monitor.Order = i;
                i++;
            }
            TriggerUpdate( );
        }

        [OnTrigger]
        private void OnUpdateMonitorOrder( string json )
        {
            if ( string.IsNullOrEmpty( json ) )
                return;

            var payload = JsonConvert.DeserializeObject<Dictionary<string, object>>( json );

            if ( payload == null )
                return;

            var windowName = ( string ) payload["WindowName"];
            var monitorName = ( string ) payload["MonitorName"];
            var direction = ( long ) payload["Direction"];

            if ( direction == 0 )
                return;

            var window = Model.Windows.FirstOrDefault( w => w.Name == windowName );
            var monitor = window?.Monitors?.FirstOrDefault( m => m.MonitorItemName == monitorName );

            if ( window == null || monitor == null )
                return;

            var monitors = window.Monitors;
            var lastOrder = monitor.Order;
            var newOrder = monitor.Order + ( ( int ) direction );

            var orderedMonitors = monitors.OrderBy( m => m.Order );

            if ( direction > 0 && monitor.Order + 1 < monitors.Count ) // Going down the list
            {
                var itemAfter = monitors.FirstOrDefault( m => m.Order == lastOrder + 1 );
                // Set the order of the item below to lastOrder
                itemAfter.Order = lastOrder;
                monitor.Order = newOrder;
                TriggerUpdate( );
            }
            else if ( monitor.Order - 1 >= 0 ) // Going up the list
            {
                var itemBefore = monitors.FirstOrDefault( m => m.Order == lastOrder - 1 );
                // Set the order of the item above to lastOrder
                itemBefore.Order = lastOrder;
                monitor.Order = newOrder;
                TriggerUpdate( );
            }

        }

        [OnTrigger]
        private void OnUpdateMonitorWindow( string json )
        {
            if ( string.IsNullOrEmpty( json ) )
                return;

            var payload = JsonConvert.DeserializeObject<Dictionary<string, object>>( json );

            if ( payload == null )
                return;

            var windowName = ( string ) payload["WindowName"];

            var window = Model.Windows.FirstOrDefault( w => w.Name == windowName );

            if ( window == null )
                return;

            if ( payload.ContainsKey( "Orientation" ) &&
                Enum.TryParse<MeterOrientation>( ( string ) payload["Orientation"], out var orientation ) )
            {
                window.Orientation = orientation;
                TriggerUpdate( );
            }
            else if ( payload.ContainsKey( "Size" ) &&
                Enum.TryParse<WindowSize>( ( string ) payload["Size"], out var size ) )
            {
                window.Size = size;
                TriggerUpdate( );
            }
        }

        private List<PluginToolbarChildItem> GetGooeeMenuItems( )
        {
            return Model.Windows.Select( w => new PluginToolbarChildItem
            {
                Label = w.Name == "Default" ? "UltimateMonitor.Menu.Default" : w.Name,
                OnClick = "OnToggleWindow",
                OnClickKey = w.Name,
                Icon = "window-maximize",
                IsFAIcon = true
            } ).ToList( );
        }

        [OnTrigger]
        private void OnToggleAddWindow( )
        {
            Model.ShowAddWindow = !Model.ShowAddWindow;
            TriggerUpdate( );
        }

        [OnTrigger]
        private void OnToggleWindow( string windowName )
        {
            if ( string.IsNullOrEmpty( windowName ) )
                return;

            var window = Model.Windows.FirstOrDefault( w => w.Name == windowName );

            if ( window == null )
                return;

            window.IsVisible = !window.IsVisible;

            TriggerUpdate( );
        }

        [OnTrigger]
        private void OnAddWindow( string windowName )
        {
            Model.ShowAddWindow = false;

            if ( Model.Windows.Count( w => w.Name.ToLowerInvariant( ) == windowName.ToLowerInvariant( ) ) == 0 )
            {
                Model.Windows.Add( new MonitorWindow
                {
                    Name = windowName,
                    Monitors = []
                } );

                _config.Windows = Model.Windows;
                _config.Save( );

                TriggerToolbarUpdate( );
            }

            OnToggleWindow( windowName );
            TriggerUpdate( );
        }

        [OnTrigger]
        private void OnRemoveWindow( string windowName )
        {
            Model.Windows.RemoveAll( w => w.Name.ToLowerInvariant( ) == windowName.ToLowerInvariant( ) );

            _config.Windows = Model.Windows;
            _config.Save( );

            TriggerToolbarUpdate( );
            TriggerUpdate( );
        }

        [OnTrigger]
        private void OnUpdateWindowPosition( string json )
        {
            if ( string.IsNullOrEmpty( json ) )
                return;

            var data = JsonConvert.DeserializeObject<Dictionary<string, object>>( json );

            if ( data == null )
                return;

            var windowName = ( string ) data["windowName"];
            var x = ( int ) ( long ) data["x"];
            var y = ( int ) ( long ) data["y"];

            var window = Model.Windows.FirstOrDefault( w => w.Name.ToLowerInvariant( ) == windowName.ToLowerInvariant( ) );

            if ( window == null )
                return;

            window.Position = new UnityEngine.Vector2Int( x, y );

            _config.Windows = Model.Windows;
            _config.Save( );

            TriggerUpdate( );
        }
    }
}

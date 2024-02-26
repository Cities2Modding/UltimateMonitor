using Gooee.Plugins;
using System.Collections.Generic;
using UnityEngine;

namespace UltimateMonitor.UI
{
    public class UltimateMonitorViewModel : Model
    {
        public List<MonitorItem> Items
        {
            get;
            set;
        }

        public List<MonitorWindow> Windows
        {
            get;
            set;
        }

        public bool ShowAddWindow
        {
            get;
            set;
        }
    }

    public class MonitorWindow
    {
        public string Name
        {
            get;
            set;
        }

        public bool IsVisible
        {
            get;
            set;
        }

        public List<MonitorWindowDisplay> Monitors
        {
            get;
            set;
        }

        public WindowSize Size
        {
            get;
            set;
        }

        public MeterOrientation Orientation
        {
            get;
            set;
        }

        public Vector2Int Position
        {
            get;
            set;
        }
    }

    public class MonitorWindowDisplay
    {
        public string MonitorItemName
        {
            get;
            set;
        }

        public int Order
        {
            get;
            set;
        }
    }

    /// <summary>
    /// A monitor statistic
    /// </summary>
    public class MonitorItem
    {
        /// <summary>
        /// The name localization key
        /// </summary>
        public string Name
        {
            get;
            set;
        }

        /// <summary>
        /// The icon
        /// </summary>
        public string Icon
        {
            get;
            set;
        }


        /// <summary>
        /// The CSS style color hex to apply
        /// </summary>
        public string Colour
        {
            get;
            set;
        }

        /// <summary>
        /// The monitor display type
        /// </summary>
        public MonitorItemType Type
        {
            get;
            set;
        } = MonitorItemType.ProgressBar;

        /// <summary>
        /// The value operation to perform on the subscriptions.
        /// </summary>
        public ValueOperation ValueOperation
        {
            get;
            set;
        } = ValueOperation.None;

        /// <summary>
        /// The value UI bindings to subscribe to
        /// </summary>
        public string[] ValueSubscriptions
        {
            get;
            set;
        }
    }

    public enum MonitorItemType
    {
        ProgressBar,
        Raw
    }

    /// <summary>
    /// The value operations to perform on statistic values
    /// </summary>
    public enum ValueOperation
    {
        None,
        Sum,
        Average,
        Mean,
        Min,
        Max,
        Variance,
        StandardDeviation,
        Custom
    }

    public enum MeterOrientation
    {
        Horizontal,
        Vertical
    }

    public enum WindowSize
    {
        Medium = 0,
        ExtraSmall = 1,
        Small = 2,
        Large = 3
    }
}

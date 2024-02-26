using System.Collections.Generic;
using UltimateMonitor.UI;

namespace UltimateMonitor.Configuration
{
    /// <summary>
    /// UltimateConfig config class
    /// </summary>
    public class UltimateMonitorConfig : ConfigBase
    {
        public List<MonitorWindow> Windows
        {
            get;
            set;
        }

        protected override string ConfigFileName => "config.json";

        public static UltimateMonitorConfig Load()
        {
            return Load<UltimateMonitorConfig>();
        }
    }
}

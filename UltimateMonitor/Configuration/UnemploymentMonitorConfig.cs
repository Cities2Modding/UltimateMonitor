using UnityEngine;

namespace UltimateMonitor.Configuration
{
    /// <summary>
    /// Core unemployment config class
    /// </summary>
    public class UnemploymentMonitorConfig : ConfigBase
    {
        public decimal X
        {
            get;
            set;
        } = -1;

        public decimal Y
        {
            get;
            set;
        } = -1;

        public decimal CityX
        {
            get;
            set;
        } = -1;

        public decimal CityY
        {
            get;
            set;
        } = -1;

        protected override string ConfigFileName => "config.json";

        public static UnemploymentMonitorConfig Load()
        {
            var config = Load<UnemploymentMonitorConfig>();

            if ( config.X < 0 || config.X > Screen.width )
                config.X = Screen.width / 4;

            if ( config.Y < 0 || config.X > Screen.height )
                config.Y = Screen.height / 4;

            config.Save( );

            return config;
        }
    }
}

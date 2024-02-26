using Gooee;
using Gooee.Plugins;
using Gooee.Plugins.Attributes;

namespace UltimateMonitor.UI
{
    [ControllerTypes( typeof( UltimateMonitorController ) )]
    [PluginToolbar( typeof( UltimateMonitorController ), "UltimateMonitor.Resources.gooee-menu.json" )]
    public class UltimateMonitorPlugin : IGooeePluginWithControllers, IGooeeChangeLog, IGooeeLanguages, IGooeeStyleSheet
    {
        public string Name => "UltimateMonitor";
        public string Version => MyPluginInfo.PLUGIN_VERSION;
        public string ScriptResource => "UltimateMonitor.Resources.ui.js";
        public string ChangeLogResource => "UltimateMonitor.Resources.changelog.md";
        public string StyleResource => null;

        public IController[] Controllers
        {
            get;
            set;
        }

        public string LanguageResourceFolder => "UltimateMonitor.Resources.lang";
    }
}

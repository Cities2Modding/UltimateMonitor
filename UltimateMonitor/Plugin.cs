using BepInEx;
using HarmonyLib;
using System;

namespace UltimateMonitor
{
    [BepInPlugin( MyPluginInfo.PLUGIN_GUID, MyPluginInfo.PLUGIN_NAME, MyPluginInfo.PLUGIN_VERSION )]
    public class Plugin : BaseUnityPlugin
    {
        private void Awake( )
        {
            Logger.LogInfo( Environment.NewLine + @"          ___              ___  ___        __         ___  __   __  
|  | |     |  |  |\/|  /\   |  |__   |\/| /  \ |\ | |  |  /  \ |__) 
\__/ |___  |  |  |  | /~~\  |  |___  |  | \__/ | \| |  |  \__/ |  \ 
                                                                    " );
            var harmony = new Harmony( MyPluginInfo.PLUGIN_GUID );
            harmony.PatchAll( );
        }
    }
}
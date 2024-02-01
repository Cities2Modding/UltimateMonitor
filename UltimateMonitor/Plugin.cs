﻿using BepInEx;
using HarmonyLib;
using HookUILib.Core;

namespace UltimateMonitor
{
    [BepInPlugin(MyPluginInfo.PLUGIN_GUID, MyPluginInfo.PLUGIN_NAME, MyPluginInfo.PLUGIN_VERSION)]
    public class Plugin : BaseUnityPlugin
    {
        private void Awake()
        {
            // Plugin startup logic
            Logger.LogInfo($"Plugin {MyPluginInfo.PLUGIN_GUID} is loaded!");
            var harmony = new Harmony(MyPluginInfo.PLUGIN_GUID);
            harmony.PatchAll();
        }
    }

    public class UnemploymentUIExtension : UIExtension
    {
        public new readonly string extensionID = "cities2modding.ultimatemonitor";

        public new readonly string extensionContent;

        public new readonly ExtensionType extensionType = ExtensionType.Panel;

        public UnemploymentUIExtension( )
        {
            extensionContent = LoadEmbeddedResource( "UltimateMonitor.Resources.ui.js" );
        }
    }
}
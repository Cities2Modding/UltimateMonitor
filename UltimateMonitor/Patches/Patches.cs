using Game;
using Game.Common;
using HarmonyLib;
using UltimateMonitor.Systems;

namespace UltimateMonitor.Patches;

[HarmonyPatch]
class Patches
{
    [HarmonyPatch(typeof(SystemOrder))]
    public static class SystemOrderPatch
    {
        [HarmonyPatch("Initialize")]
        [HarmonyPostfix]
        public static void Postfix(UpdateSystem updateSystem)
        {
            updateSystem.UpdateAt<UnemploymentMonitorSystem>(SystemUpdatePhase.GameSimulation);
            updateSystem.UpdateAt<UnemploymentMonitorUISystem>(SystemUpdatePhase.UIUpdate);
        }
    }
}


using Newtonsoft.Json;
using System;
using System.IO;
using System.Reflection;

namespace UltimateMonitor.Configuration
{
    /// <summary>
    /// Abstract base class for configuration handling.
    /// </summary>
    public abstract class ConfigBase
    {
        static readonly JsonSerializerSettings _serializerSettings = new JsonSerializerSettings
        {
            NullValueHandling = NullValueHandling.Ignore,
            Formatting = Formatting.Indented
        };

        /// <summary>
        /// Abstract property to get the configuration file name.
        /// Must be implemented by derived classes.
        /// </summary>
        protected abstract string ConfigFileName { get; }

        /// <summary>
        /// Saves the current configuration to a file.
        /// </summary>
        public virtual void Save( )
        {
            var json = JsonConvert.SerializeObject( this, _serializerSettings );
            var filePath = Path.Combine( GetAssemblyDirectory( ), ConfigFileName );
            File.WriteAllText( filePath, json );
        }

        /// <summary>
        /// Loads the configuration from a file.
        /// </summary>
        /// <returns>The loaded configuration object.</returns>
        public static T Load<T>( ) where T : ConfigBase, new()
        {
            var instance = new T( );
            var filePath = Path.Combine( GetAssemblyDirectory( ), instance.ConfigFileName );
            var json = "";

            if ( File.Exists( filePath ) )
            {
                json = File.ReadAllText( filePath );
            }
            else
                return Activator.CreateInstance<T>( );

            return ( T ) JsonConvert.DeserializeObject( json, typeof( T ), _serializerSettings );
        }

        /// <summary>
        /// Gets the directory of the currently executing assembly.
        /// </summary>
        /// <returns>The assembly directory path.</returns>
        protected static string GetAssemblyDirectory( )
        {
            return Path.GetDirectoryName( Assembly.GetExecutingAssembly( ).Location );
        }
    }
}

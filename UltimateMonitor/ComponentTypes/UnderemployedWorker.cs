using Colossal.Serialization.Entities;
using Unity.Entities;

namespace UltimateMonitor.ComponentTypes
{
    public struct UnderemployedWorker : IComponentData, IQueryTypeParameter, ISerializable
    {
        public int m_EducationLevel;
        public int m_JobLevel;

        public UnderemployedWorker(int educationLevel, int jobLevel)
        {
            m_EducationLevel = educationLevel;
            m_JobLevel = jobLevel;
        }
        public void Deserialize<TReader>(TReader reader) where TReader : IReader
        {
            reader.Read(out m_EducationLevel);
            reader.Read(out m_JobLevel);
        }

        public void Serialize<TWriter>(TWriter writer) where TWriter : IWriter
        {
            writer.Write(m_EducationLevel);
            writer.Write(m_JobLevel);
        }
    }
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  image: string;
}

export default function FeatureCard({ icon, title, description, image }: FeatureCardProps) {
  return (
    <div className="bg-[#252b3d] rounded-xl overflow-hidden hover:shadow-xl hover:shadow-[#00d4ff]/20 transition-all duration-300 hover:-translate-y-1">
      <div className="h-48 overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6">
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

import { useState } from 'react';

export default function DemoRequestForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    console.log('Demo request submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', company: '', phone: '' });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="bg-[#252b3d] rounded-xl p-8">
      <h3 className="text-2xl font-bold text-white mb-2">Request a Demo</h3>
      <p className="text-gray-400 mb-6">See how our AI can transform your estimation process</p>
      
      {submitted ? (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">✓</div>
          <div className="text-white font-bold">Thank you!</div>
          <div className="text-gray-300 text-sm">We'll contact you within 24 hours</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            required
            className="w-full bg-[#1a1f2e] text-white p-3 rounded-lg border border-gray-700 focus:border-[#00d4ff] outline-none"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address"
            required
            className="w-full bg-[#1a1f2e] text-white p-3 rounded-lg border border-gray-700 focus:border-[#00d4ff] outline-none"
          />
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Company Name"
            required
            className="w-full bg-[#1a1f2e] text-white p-3 rounded-lg border border-gray-700 focus:border-[#00d4ff] outline-none"
          />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            className="w-full bg-[#1a1f2e] text-white p-3 rounded-lg border border-gray-700 focus:border-[#00d4ff] outline-none"
          />
          <button 
            type="submit"
            className="w-full bg-[#00d4ff] text-[#1a1f2e] font-bold py-3 rounded-lg hover:bg-[#00b8e6] transition-colors"
          >
            Request Demo
          </button>
        </form>
      )}
    </div>
  );
}

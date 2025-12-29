import { useState, useRef, useEffect } from 'react';

const INSTRUMENT_OPTIONS = [
  'Guitar', 'Bass', 'Drums', 'Keys', 'Vocals', 'Saxophone', 'Trumpet', 'Violin', 'Flute', 'Cello'
];

export default function CreateJamPostModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    description: '',
    location: '',
    genre: '',
  });

  // Instrument Selection State
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [otherInstrument, setOtherInstrument] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  
  // Dropdown Visibility State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInstrumentChange = (instrument) => {
    setSelectedInstruments(prev => {
      if (prev.includes(instrument)) {
        return prev.filter(i => i !== instrument);
      } else {
        return [...prev, instrument];
      }
    });
  };

  const removeInstrument = (instrument) => {
    setSelectedInstruments(prev => prev.filter(i => i !== instrument));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Combine standard selections + "Other" input
    let finalInstruments = [...selectedInstruments];
    if (isOtherSelected && otherInstrument.trim()) {
      finalInstruments.push(otherInstrument.trim());
    }

    if (finalInstruments.length === 0) {
      alert("Please select at least one instrument.");
      return;
    }

    onSubmit({
      ...formData,
      looking_for_instrument: finalInstruments.join(', ') // "Guitar, Bass"
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create Jam Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Custom Multi-Select Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Looking For (Select all that apply) *
            </label>
            
            {/* The "Box" showing selected items */}
            <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 cursor-pointer bg-white flex flex-wrap gap-2 items-center"
            >
                {selectedInstruments.length === 0 && !isOtherSelected ? (
                    <span className="text-gray-400">Select instruments...</span>
                ) : (
                    <>
                        {selectedInstruments.map(inst => (
                            <span key={inst} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium flex items-center">
                                {inst}
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeInstrument(inst); }}
                                    className="ml-1 text-indigo-500 hover:text-indigo-900 font-bold"
                                >
                                    &times;
                                </button>
                            </span>
                        ))}
                        {isOtherSelected && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                                Other: {otherInstrument || "(type below)"}
                            </span>
                        )}
                    </>
                )}
                {/* Dropdown Arrow */}
                <div className="ml-auto text-gray-400 text-xs">▼</div>
            </div>

            {/* The Dropdown Menu (Absolute Position) */}
            {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto p-2">
                    {INSTRUMENT_OPTIONS.map((inst) => (
                        <label key={inst} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedInstruments.includes(inst)}
                                onChange={() => handleInstrumentChange(inst)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="text-gray-700">{inst}</span>
                        </label>
                    ))}
                    
                    {/* Divider */}
                    <div className="border-t border-gray-100 my-1"></div>

                    {/* Other Option */}
                    <div className="p-2">
                        <label className="flex items-center space-x-3 cursor-pointer mb-2">
                            <input
                                type="checkbox"
                                checked={isOtherSelected}
                                onChange={(e) => setIsOtherSelected(e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="text-gray-700 font-medium">Other Instrument</span>
                        </label>
                        
                        {isOtherSelected && (
                            <input
                                type="text"
                                value={otherInstrument}
                                onChange={(e) => setOtherInstrument(e.target.value)}
                                onClick={(e) => e.stopPropagation()} // Prevent dropdown close when typing
                                placeholder="Type instrument name..."
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-500"
                                autoFocus
                            />
                        )}
                    </div>
                </div>
            )}
          </div>

          {/* Genre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
            <input
              type="text"
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Jazz, Rock, Fusion"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="City, Area, or Studio"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              required
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Describe what you're looking for..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
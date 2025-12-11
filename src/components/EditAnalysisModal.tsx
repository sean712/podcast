import { useState, useEffect } from 'react';
import { X, Save, RefreshCw, ChevronDown, ChevronRight, FileText, Users, Clock, MapPin, Zap, BookOpen } from 'lucide-react';
import type { CachedAnalysis } from '../services/episodeAnalysisCache';
import type { GeocodedLocation } from '../services/geocodingService';

interface EditAnalysisModalProps {
  analysis: CachedAnalysis;
  onSave: (updates: Partial<CachedAnalysis>) => Promise<void>;
  onClose: () => void;
}

type EditMode = 'visual' | 'json';
type Section = 'summary' | 'personnel' | 'timeline' | 'locations' | 'moments' | 'references';

export default function EditAnalysisModal({ analysis, onSave, onClose }: EditAnalysisModalProps) {
  const [editMode, setEditMode] = useState<EditMode>('visual');
  const [expandedSection, setExpandedSection] = useState<Section | null>('summary');
  const [isSaving, setIsSaving] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [summary, setSummary] = useState(analysis.summary);
  const [keyPersonnel, setKeyPersonnel] = useState(analysis.key_personnel);
  const [timelineEvents, setTimelineEvents] = useState(analysis.timeline_events);
  const [locations, setLocations] = useState<GeocodedLocation[]>(analysis.locations);
  const [keyMoments, setKeyMoments] = useState(analysis.key_moments);
  const [references, setReferences] = useState(analysis.references);

  const [jsonValue, setJsonValue] = useState('');

  useEffect(() => {
    if (editMode === 'json') {
      setJsonValue(JSON.stringify({
        summary,
        key_personnel: keyPersonnel,
        timeline_events: timelineEvents,
        locations,
        key_moments: keyMoments,
        references,
      }, null, 2));
    }
  }, [editMode]);

  const handleJsonChange = (value: string) => {
    setJsonValue(value);
    setJsonError(null);
    try {
      JSON.parse(value);
    } catch (err) {
      setJsonError('Invalid JSON syntax');
    }
  };

  const applyJsonChanges = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      setSummary(parsed.summary || '');
      setKeyPersonnel(parsed.key_personnel || []);
      setTimelineEvents(parsed.timeline_events || []);
      setLocations(parsed.locations || []);
      setKeyMoments(parsed.key_moments || []);
      setReferences(parsed.references || []);
      setEditMode('visual');
      setJsonError(null);
    } catch (err) {
      setJsonError('Invalid JSON: Cannot parse');
    }
  };

  const handleSave = async () => {
    if (editMode === 'json' && jsonError) {
      alert('Please fix JSON errors before saving');
      return;
    }

    if (editMode === 'json') {
      try {
        const parsed = JSON.parse(jsonValue);
        setSummary(parsed.summary || '');
        setKeyPersonnel(parsed.key_personnel || []);
        setTimelineEvents(parsed.timeline_events || []);
        setLocations(parsed.locations || []);
        setKeyMoments(parsed.key_moments || []);
        setReferences(parsed.references || []);
      } catch (err) {
        alert('Invalid JSON: Cannot save');
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave({
        summary,
        key_personnel: keyPersonnel,
        timeline_events: timelineEvents,
        locations,
        key_moments: keyMoments,
        references,
      });
      onClose();
    } catch (err) {
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (section: Section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const addPersonnel = () => {
    setKeyPersonnel([...keyPersonnel, { name: '', role: '', relevance: '', quotes: [] }]);
    setExpandedSection('personnel');
  };

  const updatePersonnel = (index: number, field: string, value: any) => {
    const updated = [...keyPersonnel];
    updated[index] = { ...updated[index], [field]: value };
    setKeyPersonnel(updated);
  };

  const removePersonnel = (index: number) => {
    setKeyPersonnel(keyPersonnel.filter((_, i) => i !== index));
  };

  const addTimelineEvent = () => {
    setTimelineEvents([...timelineEvents, { date: '', event: '', significance: '', details: '', quotes: [] }]);
    setExpandedSection('timeline');
  };

  const updateTimelineEvent = (index: number, field: string, value: any) => {
    const updated = [...timelineEvents];
    updated[index] = { ...updated[index], [field]: value };
    setTimelineEvents(updated);
  };

  const removeTimelineEvent = (index: number) => {
    setTimelineEvents(timelineEvents.filter((_, i) => i !== index));
  };

  const addLocation = () => {
    setLocations([...locations, { name: '', coordinates: null, context: '', quotes: [] }]);
    setExpandedSection('locations');
  };

  const updateLocation = (index: number, field: string, value: any) => {
    const updated = [...locations];
    updated[index] = { ...updated[index], [field]: value };
    setLocations(updated);
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const addMoment = () => {
    setKeyMoments([...keyMoments, { title: '', description: '', quote: '', timestamp: '' }]);
    setExpandedSection('moments');
  };

  const updateMoment = (index: number, field: string, value: any) => {
    const updated = [...keyMoments];
    updated[index] = { ...updated[index], [field]: value };
    setKeyMoments(updated);
  };

  const removeMoment = (index: number) => {
    setKeyMoments(keyMoments.filter((_, i) => i !== index));
  };

  const addReference = () => {
    setReferences([...references, { type: '', name: '', context: '', quote: '', timestamp: '', urls: [] }]);
    setExpandedSection('references');
  };

  const updateReference = (index: number, field: string, value: any) => {
    const updated = [...references];
    updated[index] = { ...updated[index], [field]: value };
    setReferences(updated);
  };

  const removeReference = (index: number) => {
    setReferences(references.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-2xl px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Analysis</h2>
            <p className="text-sm text-gray-600 mt-0.5">{analysis.episode_title}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setEditMode('visual')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  editMode === 'visual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Visual Editor
              </button>
              <button
                onClick={() => setEditMode('json')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  editMode === 'json'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Raw JSON
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSaving}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 max-h-[calc(100vh-250px)] overflow-y-auto">
          {editMode === 'visual' ? (
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('summary')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-900">Summary</span>
                  </div>
                  {expandedSection === 'summary' ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {expandedSection === 'summary' && (
                  <div className="p-4">
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={6}
                      placeholder="Enter episode summary..."
                    />
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('personnel')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-gray-900">Key Personnel ({keyPersonnel.length})</span>
                  </div>
                  {expandedSection === 'personnel' ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {expandedSection === 'personnel' && (
                  <div className="p-4 space-y-3">
                    {keyPersonnel.map((person, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <input
                            type="text"
                            value={person.name || ''}
                            onChange={(e) => updatePersonnel(index, 'name', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Name"
                          />
                          <button
                            onClick={() => removePersonnel(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={person.role || ''}
                          onChange={(e) => updatePersonnel(index, 'role', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="Role"
                        />
                        <textarea
                          value={person.relevance || ''}
                          onChange={(e) => updatePersonnel(index, 'relevance', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                          placeholder="Relevance"
                        />
                      </div>
                    ))}
                    <button
                      onClick={addPersonnel}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors"
                    >
                      + Add Person
                    </button>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('timeline')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-gray-900">Timeline ({timelineEvents.length})</span>
                  </div>
                  {expandedSection === 'timeline' ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {expandedSection === 'timeline' && (
                  <div className="p-4 space-y-3">
                    {timelineEvents.map((event, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <input
                            type="text"
                            value={event.date || ''}
                            onChange={(e) => updateTimelineEvent(index, 'date', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Date"
                          />
                          <button
                            onClick={() => removeTimelineEvent(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={event.event || ''}
                          onChange={(e) => updateTimelineEvent(index, 'event', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="Event"
                        />
                        <textarea
                          value={event.details || ''}
                          onChange={(e) => updateTimelineEvent(index, 'details', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                          placeholder="Details"
                        />
                      </div>
                    ))}
                    <button
                      onClick={addTimelineEvent}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-amber-500 hover:text-amber-600 transition-colors"
                    >
                      + Add Timeline Event
                    </button>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('locations')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span className="font-semibold text-gray-900">Locations ({locations.length})</span>
                  </div>
                  {expandedSection === 'locations' ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {expandedSection === 'locations' && (
                  <div className="p-4 space-y-3">
                    {locations.map((location, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <input
                            type="text"
                            value={location.name || ''}
                            onChange={(e) => updateLocation(index, 'name', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Location name"
                          />
                          <button
                            onClick={() => removeLocation(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea
                          value={location.context || ''}
                          onChange={(e) => updateLocation(index, 'context', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                          placeholder="Context"
                        />
                      </div>
                    ))}
                    <button
                      onClick={addLocation}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-red-500 hover:text-red-600 transition-colors"
                    >
                      + Add Location
                    </button>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('moments')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-gray-900">Key Moments ({keyMoments.length})</span>
                  </div>
                  {expandedSection === 'moments' ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {expandedSection === 'moments' && (
                  <div className="p-4 space-y-3">
                    {keyMoments.map((moment, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <input
                            type="text"
                            value={moment.title || ''}
                            onChange={(e) => updateMoment(index, 'title', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Title"
                          />
                          <button
                            onClick={() => removeMoment(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea
                          value={moment.description || ''}
                          onChange={(e) => updateMoment(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                          placeholder="Description"
                        />
                        <input
                          type="text"
                          value={moment.timestamp || ''}
                          onChange={(e) => updateMoment(index, 'timestamp', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="Timestamp (e.g., 00:15:30)"
                        />
                      </div>
                    ))}
                    <button
                      onClick={addMoment}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-purple-500 hover:text-purple-600 transition-colors"
                    >
                      + Add Key Moment
                    </button>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('references')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-600" />
                    <span className="font-semibold text-gray-900">References ({references.length})</span>
                  </div>
                  {expandedSection === 'references' ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {expandedSection === 'references' && (
                  <div className="p-4 space-y-3">
                    {references.map((ref, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <input
                            type="text"
                            value={ref.type || ''}
                            onChange={(e) => updateReference(index, 'type', e.target.value)}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Type"
                          />
                          <input
                            type="text"
                            value={ref.name || ''}
                            onChange={(e) => updateReference(index, 'name', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Name"
                          />
                          <button
                            onClick={() => removeReference(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea
                          value={ref.context || ''}
                          onChange={(e) => updateReference(index, 'context', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                          placeholder="Context"
                        />
                        <input
                          type="text"
                          value={ref.timestamp || ''}
                          onChange={(e) => updateReference(index, 'timestamp', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="Timestamp (optional)"
                        />
                      </div>
                    ))}
                    <button
                      onClick={addReference}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-cyan-500 hover:text-cyan-600 transition-colors"
                    >
                      + Add Reference
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {jsonError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {jsonError}
                </div>
              )}
              <textarea
                value={jsonValue}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="w-full h-[500px] px-4 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                spellCheck={false}
              />
              <button
                onClick={applyJsonChanges}
                disabled={!!jsonError}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                Apply JSON Changes
              </button>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 rounded-b-2xl px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || (editMode === 'json' && !!jsonError)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

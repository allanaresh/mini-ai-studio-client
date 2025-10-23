import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generationService, Generation } from '../services/generation.service';
import { toast } from 'react-toastify';

export const Dashboard: React.FC = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(Date.now());
  const [preview, setPreview] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>([]);
  const [isLoadingGenerations, setIsLoadingGenerations] = useState(false);

  const fetchRecentGenerations = useCallback(async () => {
    try {
      if (!token) return;
      setIsLoadingGenerations(true);
      const generations = await generationService.getRecentGenerations(token);
      setRecentGenerations(generations || []);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch recent generations';
      setError(errorMessage);
      toast.error(errorMessage);
      setRecentGenerations([]);
    } finally {
      setIsLoadingGenerations(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchRecentGenerations();
  }, [token, navigate, fetchRecentGenerations]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      // Check file type
      if (!selectedFile.type.match(/^image\/(jpeg|jpg|png)$/)) {
        toast.error('Only JPEG and PNG images are allowed');
        return;
      }

      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      toast.info('Image selected. Add a prompt and click Generate to continue.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !prompt || !token) {
      toast.error('Please select an image and provide a prompt');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      toast.info('Processing your image...', { autoClose: false, toastId: 'generation' });
      await generationService.uploadImage(file, prompt, token);
      toast.dismiss('generation');
      toast.success('Generation completed successfully!');
      
      await fetchRecentGenerations();
      setFile(null);
      setInputKey(Date.now()); // Reset file input
      setPreview('');
      setPrompt('');
    } catch (error: any) {
      toast.dismiss('generation');
      const errorMessage = error.message || 'An error occurred during generation';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Create a Generation</h2>
                  <div>
                    <button
                      onClick={() => { logout(); navigate('/login'); }}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Logout
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="mb-4">
                        <label 
                          htmlFor="image-upload"
                          className="block text-gray-700 text-sm font-bold mb-2"
                        >
                          Upload Image
                        </label>
                        <input
                          id="image-upload"
                          type="file"
                          key={inputKey}
                          accept="image/*"
                          onChange={handleFileChange}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          data-testid="file-input"
                        />
                      </div>

                      {preview && (
                        <div className="mb-4">
                          <img src={preview} alt="Preview" className="max-w-xs mx-auto" />
                        </div>
                      )}

                      <div className="mb-4">
                        <label 
                          htmlFor="prompt-input"
                          className="block text-gray-700 text-sm font-bold mb-2"
                        >
                          Prompt
                        </label>
                        <textarea
                          id="prompt-input"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          rows={3}
                          placeholder="Enter your prompt here..."
                          data-testid="prompt-input"
                        />
                      </div>                  {error && (
                    <div className="mb-4 text-red-500 text-sm">
                      <div>{error}</div>
                      <div className="mt-2">
                        <button
                          onClick={() => { setError(''); fetchRecentGenerations(); }}
                          className="text-sm text-indigo-600 hover:underline"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !file || !prompt}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      (isLoading || !file || !prompt) && 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? 'Processing...' : 'Generate'}
                  </button>
                </form>

{isLoadingGenerations ? (
                  <div className="mt-8">
                    <p className="text-gray-600">Loading recent generations...</p>
                  </div>
                ) : recentGenerations.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900">Recent Generations</h3>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {recentGenerations.map((generation) => (
                        <div key={generation.id} className="border rounded-lg p-4">
                          <img
                            src={generation.imagePath}
                            alt={generation.prompt}
                            className="w-full h-32 object-cover rounded"
                          />
                          <p className="mt-2 text-sm text-gray-600 truncate">
                            {generation.prompt}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '../Dashboard';
import { toast } from 'react-toastify';
import { generationService } from '../../services/generation.service';

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Mock generation service
jest.mock('../../services/generation.service', () => ({
  generationService: {
    uploadImage: jest.fn(),
    getRecentGenerations: jest.fn().mockResolvedValue([
      {
        id: '1',
        prompt: 'test prompt 1',
        imagePath: '/path/to/image1.jpg',
        createdAt: new Date().toISOString(),
      },
    ]),
  },
}));

// Mock auth context
const mockLogout = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    token: 'fake-token',
    logout: mockLogout,
    isAuthenticated: true,
  }),
}));

describe('Dashboard Component', () => {
  const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  const renderDashboard = () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  };

  it('validates file size', async () => {
    renderDashboard();

    // Create a large file (6MB)
    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });

    // Get file input and simulate file selection
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    // Verify error toast was shown
    expect(toast.error).toHaveBeenCalledWith('File size must be less than 5MB');
  });

  it('validates file type', async () => {
    renderDashboard();

    // Create an invalid file type
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

    // Get file input and simulate file selection
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    // Verify error toast was shown
    expect(toast.error).toHaveBeenCalledWith('Only JPEG and PNG images are allowed');
  });

  it('handles successful image upload and generation', async () => {
    // Mock successful upload
    (generationService.uploadImage as jest.Mock).mockResolvedValueOnce({
      id: '1',
      prompt: 'test prompt',
      imagePath: '/path/to/generated.jpg',
      createdAt: new Date().toISOString(),
    });

    renderDashboard();

    // Set up file and prompt
    const fileInput = screen.getByLabelText(/upload image/i);
    const promptInput = screen.getByPlaceholderText(/enter your prompt/i);
    const submitButton = screen.getByRole('button', { name: /generate/i });

    // Simulate file selection and prompt entry
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    fireEvent.change(promptInput, { target: { value: 'test prompt' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Verify loading toast was shown
    expect(toast.info).toHaveBeenCalledWith('Processing your image...', expect.any(Object));

    // Wait for success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Generation completed successfully!');
    });

    // Verify the generation service was called correctly
    expect(generationService.uploadImage).toHaveBeenCalledWith(
      mockFile,
      'test prompt',
      'fake-token'
    );
  });

  it('handles generation failure', async () => {
    // Mock failed upload
    const errorMessage = 'Failed to generate image';
    (generationService.uploadImage as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    renderDashboard();

    // Set up file and prompt
    const fileInput = screen.getByLabelText(/upload image/i);
    const promptInput = screen.getByPlaceholderText(/enter your prompt/i);
    const submitButton = screen.getByRole('button', { name: /generate/i });

    // Simulate file selection and prompt entry
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    fireEvent.change(promptInput, { target: { value: 'test prompt' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('displays recent generations', async () => {
    // Mock the service response
    const mockGenerations = [
      {
        id: '1',
        prompt: 'test prompt 1',
        imagePath: '/path/to/image1.jpg',
        createdAt: new Date().toISOString(),
      }
    ];
    (generationService.getRecentGenerations as jest.Mock).mockResolvedValueOnce(mockGenerations);

    renderDashboard();

    // First there should be a loading state
    expect(screen.getByText(/loading recent generations/i)).toBeInTheDocument();

    // Wait for loading state to disappear
    await waitFor(() => {
      expect(screen.queryByText(/loading recent generations/i)).not.toBeInTheDocument();
    });

    // Then check for the content
    expect(screen.getByText(/test prompt 1/i)).toBeInTheDocument();
  });
});
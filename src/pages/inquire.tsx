'use client';

import { FC, useState, FormEvent } from 'react';
import styled from 'styled-components';
import PageLayout from '../components/PageLayout';

const InquireContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f5f5f5;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const IntroText = styled.p`
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.2rem;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
    margin-bottom: 0.3rem;
  }
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #ddd;
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #96885f;
  }
  
  @media (max-width: 768px) {
    padding: 0.6rem;
    font-size: 0.9rem;
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid #ddd;
  font-size: 1rem;
  min-height: 150px;
  resize: vertical;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #96885f;
  }
  
  @media (max-width: 768px) {
    padding: 0.6rem;
    font-size: 0.9rem;
    min-height: 120px;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #ddd;
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #96885f;
  }
  
  @media (max-width: 768px) {
    padding: 0.6rem;
    font-size: 0.9rem;
  }
`;

const SubmitButton = styled.button`
  padding: 1rem 2rem;
  background-color: transparent;
  border: 4px solid #96885f;
  color: #333;
  font-size: 1.2rem;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: center;
  margin-top: 1rem;

  &:hover {
    background-color: rgba(150, 136, 95, 0.2);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
    border-width: 3px;
    margin-top: 0.5rem;
  }
`;

const SuccessMessage = styled.div`
  background-color: rgba(75, 181, 67, 0.1);
  border: 2px solid #4bb543;
  padding: 1.5rem;
  text-align: center;
  margin-top: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
    margin-top: 1.5rem;
    
    h3 {
      font-size: 1.2rem;
    }
    
    p {
      font-size: 0.9rem;
    }
  }
`;

const ErrorMessage = styled.div`
  color: #d9534f;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    margin-top: 0.3rem;
  }
`;

const SectionHeader = styled.h2`
  font-size: 1.5rem;
  margin: 2rem 0 1rem 0;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-bottom: 2px solid #96885f;
  padding-bottom: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
    margin: 1.5rem 0 0.8rem 0;
  }
`;

const SectionDescription = styled.p`
  margin-bottom: 1.5rem;
  color: #666;
  font-style: italic;
  
  @media (max-width: 768px) {
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }
`;

const NameRow = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0;
  }
`;

const PhoneRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const CountrySelect = styled.select`
  padding: 0.75rem;
  border: 2px solid #ddd;
  font-size: 1rem;
  min-width: 80px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #96885f;
  }
  
  @media (max-width: 768px) {
    padding: 0.6rem;
    font-size: 0.9rem;
    min-width: 60px;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 2rem;
  margin: 1rem 0;
  
  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  
  input[type="radio"] {
    margin: 0;
    accent-color: #96885f;
  }
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const FileUploadArea = styled.div`
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 1rem 0;
  
  &:hover {
    border-color: #96885f;
    background-color: rgba(150, 136, 95, 0.05);
  }
  
  input[type="file"] {
    display: none;
  }
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const UploadIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #96885f;
`;

const UploadText = styled.div`
  font-size: 1rem;
  color: #666;
  margin-bottom: 0.5rem;
`;

const UploadSubtext = styled.div`
  font-size: 0.9rem;
  color: #999;
`;

const FileList = styled.div`
  margin-top: 1rem;
  text-align: left;
`;

const FileItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const RemoveFileButton = styled.button`
  background: none;
  border: none;
  color: #d9534f;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  
  &:hover {
    color: #c9302c;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
  
  input[type="checkbox"] {
    accent-color: #96885f;
  }
  
  label {
    cursor: pointer;
    font-size: 1rem;
  }
`;

const ArtistStatement = styled.div`
  background-color: #f9f9f9;
  border-left: 4px solid #96885f;
  padding: 1rem;
  margin: 2rem 0;
  font-style: italic;
  color: #666;
  
  @media (max-width: 768px) {
    margin: 1.5rem 0;
    padding: 0.8rem;
  }
`;

const BudgetInfo = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
  font-style: italic;
`;

const InquirePage: FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    budget: '',
    tattooConcept: '',
    animalPersonEmotion: '',
    abstractEnergy: '',
    tattooSize: '',
    colorPreference: '',
    newsletterSignup: false,
    inquiryType: 'tattoo',
    message: '', // Legacy field for backward compatibility
  });

  const [photoReferences, setPhotoReferences] = useState<File[]>([]);
  const [placementPhotos, setPlacementPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileUpload = (
    files: FileList | null, 
    setter: React.Dispatch<React.SetStateAction<File[]>>
  ) => {
    if (!files) return;
    
    const newFiles = Array.from(files).slice(0, 10); // Limit to 10 files
    setter(prev => [...prev, ...newFiles].slice(0, 10)); // Keep only 10 total files
  };

  const removeFile = (
    index: number, 
    setter: React.Dispatch<React.SetStateAction<File[]>>
  ) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.tattooConcept.trim()) {
      newErrors.tattooConcept = 'Tattoo concept description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData to handle file uploads
      const submitData = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          submitData.append(key, value.toString());
        } else {
          submitData.append(key, value);
        }
      });

      // Add photo reference files
      photoReferences.forEach((file, index) => {
        submitData.append(`photoReference_${index}`, file);
      });

      // Add placement photo files
      placementPhotos.forEach((file, index) => {
        submitData.append(`placementPhoto_${index}`, file);
      });

      const response = await fetch('/api/inquiries/create', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit inquiry');
      }

      // Success
      setIsSubmitted(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        budget: '',
        tattooConcept: '',
        animalPersonEmotion: '',
        abstractEnergy: '',
        tattooSize: '',
        colorPreference: '',
        newsletterSignup: false,
        inquiryType: 'tattoo',
        message: '',
      });
      setPhotoReferences([]);
      setPlacementPhotos([]);
    } catch (error: unknown) {
      console.error(error);
      setErrors({ form: 'Something went wrong. Please try again later.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout title="Tattoo Inquiries">
      <InquireContainer>
        <IntroText>
          Please provide contact information below so we can get back to you :)
        </IntroText>

        {isSubmitted ? (
          <SuccessMessage>
            <h3>Thank you for your inquiry!</h3>
            <p>
              I&apos;ve received your message and will respond within 2-3 business
              days.
            </p>
          </SuccessMessage>
        ) : (
          <Form onSubmit={handleSubmit}>
            {/* About You Section */}
            <SectionHeader>About You</SectionHeader>
            
            <NameRow>
              <FormGroup>
                <Label htmlFor="firstName">First *</Label>
                <Input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                />
                {errors.firstName && <ErrorMessage>{errors.firstName}</ErrorMessage>}
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="lastName">Last *</Label>
                <Input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />
                {errors.lastName && <ErrorMessage>{errors.lastName}</ErrorMessage>}
              </FormGroup>
            </NameRow>

            <FormGroup>
              <Label htmlFor="email">Email *</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="phone">Phone *</Label>
              <PhoneRow>
                <CountrySelect>
                  <option value="US">🇺🇸</option>
                </CountrySelect>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(201) 555-0123"
                  style={{ flex: 1 }}
                />
              </PhoneRow>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="budget">Do you have a strict budget for this project? *Current rate: $200/hour*</Label>
              <Input
                type="text"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
              />
            </FormGroup>

            {/* About Your Tattoo Section */}
            <SectionHeader>About Your Tattoo</SectionHeader>
            
            <FormGroup>
              <Label htmlFor="tattooConcept">Please describe the idea/concept of your tattoo. *</Label>
              <TextArea
                id="tattooConcept"
                name="tattooConcept"
                value={formData.tattooConcept}
                onChange={handleChange}
                placeholder="Describe your tattoo concept in detail..."
              />
              {errors.tattooConcept && <ErrorMessage>{errors.tattooConcept}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="animalPersonEmotion">If this is a design that includes an animal or person, what emotion do you want the energy of the subject to portray? *</Label>
              <TextArea
                id="animalPersonEmotion"
                name="animalPersonEmotion"
                value={formData.animalPersonEmotion}
                onChange={handleChange}
                placeholder="Describe the emotional energy you want to convey..."
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="abstractEnergy">If this is an abstract concept, can you provide adjectives and the energy you want for the design *</Label>
              <TextArea
                id="abstractEnergy"
                name="abstractEnergy"
                value={formData.abstractEnergy}
                onChange={handleChange}
                placeholder="Provide adjectives and describe the energy you want..."
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="tattooSize">Size estimate of your desired tattoo *</Label>
              <Input
                type="text"
                id="tattooSize"
                name="tattooSize"
                value={formData.tattooSize}
                onChange={handleChange}
                placeholder="e.g., 4 inches, palm-sized, etc."
              />
            </FormGroup>

            <FormGroup>
              <Label>Photo references/inspirations</Label>
              <FileUploadArea
                onClick={() => document.getElementById('photoReferences')?.click()}
              >
                <UploadIcon>📁</UploadIcon>
                <UploadText>Drag & Drop Files, Choose Files to Upload</UploadText>
                <UploadSubtext>You can upload up to 10 files.</UploadSubtext>
                <input
                  type="file"
                  id="photoReferences"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files, setPhotoReferences)}
                />
              </FileUploadArea>
              <SectionDescription>
                Please attach all photo references/inspirations. *Note: Do not limit to only tattoo references, but also photographs or any traditional art styles that excite you* If you do not have a gmail account, please email photos in a separate email! thanks :)
              </SectionDescription>
              {photoReferences.length > 0 && (
                <FileList>
                  {photoReferences.map((file, index) => (
                    <FileItem key={index}>
                      <span>{file.name}</span>
                      <RemoveFileButton onClick={() => removeFile(index, setPhotoReferences)}>
                        ×
                      </RemoveFileButton>
                    </FileItem>
                  ))}
                </FileList>
              )}
            </FormGroup>

            <FormGroup>
              <Label>Do you want your tattoo in Color or Black + Gray?</Label>
              <RadioGroup>
                <RadioOption>
                  <input
                    type="radio"
                    name="colorPreference"
                    value="color"
                    checked={formData.colorPreference === 'color'}
                    onChange={handleChange}
                  />
                  Color
                </RadioOption>
                <RadioOption>
                  <input
                    type="radio"
                    name="colorPreference"
                    value="black_gray"
                    checked={formData.colorPreference === 'black_gray'}
                    onChange={handleChange}
                  />
                  Black + Gray
                </RadioOption>
              </RadioGroup>
            </FormGroup>

            <FormGroup>
              <Label>Tattoo Placement</Label>
              <FileUploadArea
                onClick={() => document.getElementById('placementPhotos')?.click()}
              >
                <UploadIcon>📁</UploadIcon>
                <UploadText>Drag & Drop Files, Choose Files to Upload</UploadText>
                <UploadSubtext>You can upload up to 10 files.</UploadSubtext>
                <input
                  type="file"
                  id="placementPhotos"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files, setPlacementPhotos)}
                />
              </FileUploadArea>
              <SectionDescription>
                Where do you want this tattoo placed? Please attach photos of the area you had in mind. *Tip: take photo with camera parallel to body surface with good lighting- it's best to find a friend to help!*
              </SectionDescription>
              {placementPhotos.length > 0 && (
                <FileList>
                  {placementPhotos.map((file, index) => (
                    <FileItem key={index}>
                      <span>{file.name}</span>
                      <RemoveFileButton onClick={() => removeFile(index, setPlacementPhotos)}>
                        ×
                      </RemoveFileButton>
                    </FileItem>
                  ))}
                </FileList>
              )}
            </FormGroup>

            <ArtistStatement>
              As much as I wish to help everyone, I will be assessing which projects fit my energy. I will do my best to direct you to another artist if I feel the project is not a good fit.
            </ArtistStatement>

            <CheckboxGroup>
              <input
                type="checkbox"
                id="newsletterSignup"
                name="newsletterSignup"
                checked={formData.newsletterSignup}
                onChange={handleChange}
              />
              <label htmlFor="newsletterSignup">Sign-up to our newsletter?</label>
            </CheckboxGroup>

            {errors.form && <ErrorMessage>{errors.form}</ErrorMessage>}

            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Submit'}
            </SubmitButton>
          </Form>
        )}
      </InquireContainer>
    </PageLayout>
  );
};

export default InquirePage;

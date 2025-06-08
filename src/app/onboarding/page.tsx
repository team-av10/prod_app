'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Head from 'next/head';
import Image from 'next/image';

interface UserData {
  fullName: string;
  email: string;
  phoneNumber: string;
  farmSize: string;
  cropTypes: string;
  soilType: string;
  location: string;
  plantingDate: string;
  fertilizationDate: string;
  harvestingDate: string;
}

type FormField = {
  id: string;
  label: string;
  type: string;
  options?: string[];
  validation?: (value: string) => boolean;
  errorMessage?: string;
};

type Message = {
  text: string;
  sender: 'bot' | 'user';
  fieldId?: string;
};

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<UserData>({
    fullName: '',
    email: user?.email || '',
    phoneNumber: '',
    farmSize: '',
    cropTypes: '',
    soilType: '',
    location: '',
    plantingDate: '',
    fertilizationDate: '',
    harvestingDate: ''
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentFieldIndex, setCurrentFieldIndex] = useState<number>(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});

  const formFields: FormField[] = [
    { id: 'fullName', label: 'Tell me your Full Name 👤', type: 'text', validation: (value) => value.trim().length > 0, errorMessage: 'Please enter your name' },
    { id: 'location', label: 'Tell me your current location 📍', type: 'dropdown', options: ['Chennai', 'Coimbatore', 'Tirunelveli'] },
    { id: 'phoneNumber', label: 'Tell me your phone number 📞', type: 'tel', validation: (value) => /^\d+$/.test(value) && value.length >= 4, errorMessage: 'Please enter a valid phone number (numbers only)' },
    { id: 'soilType', label: 'Type of Soil do you have 🌱', type: 'dropdown', options: ['Black', 'Red', 'Alluvial', 'Laterite', 'Clayey', 'Sandy'] },
    { id: 'farmSize', label: 'Size of your farm do you have 📏', type: 'dropdown', options: ['less than 5 acres', '5-25 acres', 'more than 100 acres'] },
    { id: 'cropTypes', label: 'Type of crop/tree do you grow 🌾🌳', type: 'dropdown', options: ['paddy', 'sugarcane', 'coconut', 'banana', 'corn', 'mango'] },
    { id: 'plantingDate', label: 'When did you plant your crops/trees? 🌱', type: 'date' },
    { id: 'fertilizationDate', label: 'When did you last fertilize your crops/trees? 🧪', type: 'date' },
    { id: 'harvestingDate', label: 'When do you plan to harvest your crops/trees? 🚜', type: 'date' }
  ];


  useEffect(() => {
    const checkUserData = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          router.push('/dashboard');
        }
      }
    };
    checkUserData();
  }, [user, router]);

  useEffect(() => {
    console.log('useEffect - Component Mounted');
    setMessages([
      { text: 'Hello, Farmer! I need to collect some information about you and your farm. Let\'s get started!', sender: 'bot' }
    ]);
    addNextQuestion();
  }, []);

  useEffect(() => {
    scrollToBottom();
    const currentField = formFields[currentFieldIndex];
    console.log('useEffect [messages, currentFieldIndex] - currentFieldIndex:', currentFieldIndex, 'Current Field ID:', currentField?.id);
    if (currentField && inputRefs.current[currentField.id]) {
      inputRefs.current[currentField.id]?.focus();
    }

    // Check if all questions have been answered
    if (currentFieldIndex >= formFields.length && !completed && !isSubmitting) {
      console.log('useEffect - All questions answered');
      // setMessages(prev => [...prev, { text: 'Thank you for providing all the information! Let me save that for you.', sender: 'bot' }]);
      submitToFirestore();
      return; // Prevent further execution in this useEffect
    }

    // Add next question ONLY if the last message was from the user AND we are not at the end
    if (messages.length > 1 && messages[messages.length - 1].sender === 'user' && currentFieldIndex < formFields.length) {
      addNextQuestion();
    }
  }, [messages, currentFieldIndex, formFields, completed, isSubmitting]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addNextQuestion = () => {
    console.log('addNextQuestion - currentFieldIndex (before increment):', currentFieldIndex);
    if (currentFieldIndex < formFields.length) {
      const field = formFields[currentFieldIndex];
      console.log('addNextQuestion - Asking question for field ID:', field.id);
      setMessages(prev => [...prev, { text: field.label, sender: 'bot', fieldId: field.id }]);
    }
  };

  const handleInputChange = (fieldId: string, value: string) => {
    console.log('handleInputChange - fieldId:', fieldId, 'value:', value);
    setInputValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (fieldId: string) => {
    console.log('handleSubmit - fieldId:', fieldId, 'currentFieldIndex (before):', currentFieldIndex);
    const value = inputValues[fieldId] || '';
    if (!value.trim()) {
      console.log('handleSubmit - Input is empty, returning');
      return;
    }

    const fieldIndex = formFields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) {
      console.log('handleSubmit - Field not found, returning');
      return;
    }

    const field = formFields[fieldIndex];

    if (field.validation && !field.validation(value)) {
      console.log('handleSubmit - Validation failed for:', fieldId, 'value:', value);
      setMessages(prev => [...prev, { text: field.errorMessage || 'Invalid input, please try again.', sender: 'bot' }]);
      return;
    }

    setMessages(prev => [...prev, { text: value, sender: 'user' }]);
    setFormData(prev => ({ ...prev, [field.id]: value }));
    console.log('formData after updating:', formData);
    setInputValues(prev => ({ ...prev, [fieldId]: '' }));

    setCurrentFieldIndex(currentFieldIndex + 1);
    console.log('handleSubmit - currentFieldIndex (after increment):', currentFieldIndex);
  };

  const submitToFirestore = async () => {
    if (!user) {
      setMessages(prev => [...prev, { text: 'Error: User not authenticated', sender: 'bot' }]);
      return;
    }
    setIsSubmitting(true);
    console.log('submitToFirestore - Submitting data:', formData);
    try {
      const docRef = await setDoc(doc(db, 'users', user.uid), {...formData, createdAt: new Date().toISOString(), email: user.email});
      setMessages(prev => [...prev, { text: `Thank you for answering the questions successfully!`, sender: 'bot' }]);
      setCompleted(true);
      router.push('/dashboard');
    } catch (error) {
      console.error('submitToFirestore - Error submitting:', error);
      setMessages(prev => [...prev, { text: `Error submitting form: ${error instanceof Error ? error.message : 'Unknown error'}`, sender: 'bot' }]);
    } finally {
      setIsSubmitting(false);
      console.log('submitToFirestore - Submission finished');
    }
  };

  const resetForm = () => {
    console.log('resetForm - Resetting the form');
    setCurrentFieldIndex(0);
    setFormData({});
    setInputValues({});
    setMessages([{ text: 'Hello! I need to collect some information about your farm. Let\'s get started!', sender: 'bot' }]);
    setCompleted(false);
    addNextQuestion();
  };

  const renderInputField = (fieldId?: string) => {
    if (!fieldId) return null;
    const field = formFields.find(f => f.id === fieldId);
    if (!field) {
      console.log('renderInputField - Field not found for ID:', fieldId);
      return null;
    }

    const isCurrentField = formFields[currentFieldIndex]?.id === fieldId;
    console.log('renderInputField - Rendering field:', fieldId, 'currentFieldIndex:', currentFieldIndex, 'isCurrentField:', isCurrentField);

    const submitAnswer = (e: React.FormEvent) => {
      e.preventDefault();
      handleSubmit(fieldId);
    };

    const inputValue = inputValues[fieldId] || '';
    console.log('renderInputField - fieldId:', fieldId, 'inputValue:', inputValue);

    const baseInputClasses = "px-4 py-2 my-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 animate-slide-in-up";
    const baseSelectClasses = "px-4 py-2 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 animate-slide-in-up";
    const buttonClasses = "bg-green-500 text-white px-4 py-2 my-2 mx-1 rounded-full hover:bg-green-600 disabled:opacity-50 animate-slide-in-up";
    const submitButtonIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>);

if (field.type === 'dropdown') {
  return (
    <form onSubmit={submitAnswer} className={`mt-2 flex ${isCurrentField ? '' : 'hidden'}`}>
      <select
        ref={(el) => { inputRefs.current[fieldId] = el; }}
        className={baseSelectClasses}
        value={inputValue}
        onChange={(e) => handleInputChange(fieldId, e.target.value)}
      >
        <option value="" disabled>Select an option</option>
        {field.options?.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <button type="submit" className={buttonClasses} disabled={!inputValue.trim()}>{submitButtonIcon}</button>
    </form>
  );
} else if (field.type === 'date') {
  return (
    <form onSubmit={submitAnswer} className={`mt-2 flex ${isCurrentField ? '' : 'hidden'}`}>
      <input ref={(el) => { inputRefs.current[fieldId] = el; }} type="date" className={baseInputClasses} value={inputValue} onChange={(e) => handleInputChange(fieldId, e.target.value)} />
      <button type="submit" className={buttonClasses} disabled={!inputValue.trim()}>{submitButtonIcon}</button>
    </form>
  );
} else {
  return (
    <form onSubmit={submitAnswer} className={`mt-2 flex ${isCurrentField ? '' : 'hidden'}`}>
      <input ref={(el) => { inputRefs.current[fieldId] = el; }} type={field.type} className={baseInputClasses} value={inputValue} onChange={(e) => handleInputChange(fieldId, e.target.value)} placeholder={`Enter your ${field.id}`} />
      <button type="submit" className={buttonClasses} disabled={!inputValue.trim()}>{submitButtonIcon}</button>
    </form>
  );
}
};

return (
<div className=" bg-gray-100 flex flex-col animate-slide-in-up">
  <Head>
    <title>Farm Data Collection</title>
    <meta name="description" content="Farm data collection chatbot" />
  </Head>

  <main className="flex-grow flex items-center justify-center p-4">
    <div className="bg-white rounded-4xl shadow-lg overflow-hidden w-full max-w-md h-[600px] flex flex-col">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 p-4 text-white flex items-center">
        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
          <svg className="w-6 h-6 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path fill="currentColor" d="M10.9715 12.2168c-.0118.0406-.0234.0795-.0347.1166.0391.0574.0819.1192.1278.1855.3277.473.812 1.172 1.2141 2.0892.2147-.2864.4616-.5799.7447-.8832l-.0024-.0317c-.0236-.3254-.0361-.7783.0091-1.2905.0882-.9978.4095-2.3695 1.4623-3.39555 1.0079-.98229 2.3556-1.42385 3.4044-1.59916.5344-.08932 1.0323-.11665 1.4296-.09869.1954.00883.3932.02974.5707.07034.0872.01996.1979.05097.3114.10232.0867.03927.3102.14854.4769.39195.1453.21217.1993.45929.22.55586.0321.14963.0559.32134.0712.50398.0307.36676.0311.82807-.0291 1.32915-.1181.9828-.4871 2.2522-1.47 3.2102-1.0357 1.0093-2.4736 1.3803-3.5197 1.5249-.542.0749-1.0253.0952-1.3736.0969-.036.0002-.0706.0002-.1037 0-.931.9987-1.2688 1.7317-1.4072 2.3512-.0345.1545-.0581.303-.0739.451.0004.0342.0006.0685.0006.1029v2c0 .5523-.4477 1-1 1s-1-.4477-1-1c0-.1991-.0064-.4114-.0131-.6334-.0142-.4713-.0298-.9868.0117-1.5138-.0358-1.8786-.7555-2.9405-1.40123-3.8932-.13809-.2037-.2728-.4025-.39671-.6032-.05186-.0105-.10709-.0222-.16538-.035-.39471-.0865-.93803-.2268-1.53416-.4432-1.15636-.4197-2.67587-1.1841-3.58743-2.5531-.90552-1.35993-1.03979-2.96316-.96002-4.15955.04066-.60984.13916-1.15131.24451-1.56046.05234-.20327.10977-.38715.16845-.53804.02865-.07367.06419-.15663.10713-.23658.02132-.03968.0522-.09319.0933-.15021.03213-.04456.11389-.15344.24994-.25057.18341-.13093.36351-.16755.42749-.17932.0854-.01572.16019-.01941.21059-.02024.1023-.0017.20235.00733.28493.0176.17089.02126.37298.06155.58906.11526.43651.1085.99747.2886 1.59668.54576 1.16944.50188 2.63819 1.3629 3.52935 2.70126.9248 1.38891.9601 2.99601.818 4.14739-.0726.589-.1962 1.0975-.3016 1.4594Z"/>
        </svg>

        </div>
        <div>
          <h1 className="text-xl font-bold">Farmer's form</h1>
          <p className="text-sm opacity-75">To know more about yourself</p>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index}>
              <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`rounded-lg p-3 max-w-xs md:max-w-md animate-slide-in-up ${
                    message.sender === 'user'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  <p>{message.text}</p>
                </div>
              </div>
              {renderInputField(message.fieldId)}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {completed && (
        <div className="p-4 border-t">
          <button
            onClick={resetForm}
            className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Start New Form
          </button>
        </div>
      )}
    </div>
  </main>
</div>
);
} 
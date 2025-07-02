import React, { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import * as Icons from 'lucide-react';
import { useCRMStore } from '../../store/crmStore';
import AddNewUserModal from '../AddNewUserModal';
import PhoneNumberInput from './PhoneNumberInput';

interface AddNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: string;
}

const AddNewModal: React.FC<AddNewModalProps> = ({ isOpen, onClose, defaultType }) => {
  const [selectedType, setSelectedType] = useState<string>();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showUserModal, setShowUserModal] = useState(false);
  const { addLead, addContact, addDeal, addTask, addDealer, addSubsidiary } = useCRMStore();

  const recordTypes = [
    { id: 'user', name: 'User', icon: 'UserCog', description: 'A new team member or admin' },
    { id: 'lead', name: 'Lead', icon: 'UserPlus', description: 'A potential customer' },
    { id: 'contact', name: 'Contact', icon: 'User', description: 'A person you do business with' },
    { id: 'deal', name: 'Deal', icon: 'Target', description: 'A sales opportunity' },
    { id: 'task', name: 'Task', icon: 'CheckSquare', description: 'A to-do item' },
    { id: 'dealer', name: 'Dealer', icon: 'Handshake', description: 'A distributor or vendor partner' },
    { id: 'subsidiary', name: 'Subsidiary', icon: 'Building', description: 'A regional branch of the company' },
  ];

  useEffect(() => {
    if (isOpen && defaultType) {
      setSelectedType(defaultType);
      if (defaultType === 'user') {
        setShowUserModal(true);
      }
    }
  }, [isOpen, defaultType]);

  const handleTypeSelection = (typeId: string) => {
    if (typeId === 'user') {
      setShowUserModal(true);
    } else {
      setSelectedType(typeId);
    }
  };

  const handleBackToSelection = () => {
    setSelectedType('');
    setFormData({});
    setShowUserModal(false);
  };

  const handleUserModalClose = () => {
    // Instead of closing completely, go back to selection
    handleBackToSelection();
  };

  const handleMainModalClose = () => {
    // Reset everything and close
    setSelectedType('');
    setFormData({});
    setShowUserModal(false);
    onClose();
  };

  const handleUserAdded = () => {
    // User was successfully created, close everything
    setShowUserModal(false);
    setSelectedType('');
    setFormData({});
    onClose();
  };

  const getFormFields = () => {
    const leadSourceOptions = [
      'Advertisement', 'Cold Call', 'Employee Referral', 'External Referral', 'Online Store',
      'X (Twitter)', 'Facebook', 'Partner', 'Public Relations', 'Sales Email Alias',
      'Seminar Partner', 'Internal Seminar', 'Trade Show', 'Web Download', 'Web Research', 'Chat'
    ];

    switch (selectedType) {
      case 'lead':
        return [
          { name: 'leadOwner', label: 'Lead Owner', type: 'text', required: true },
          { name: 'firstName', label: 'First Name', type: 'text', required: true },
          { name: 'lastName', label: 'Last Name', type: 'text', required: true },
          { name: 'company', label: 'Company', type: 'text', required: true },
          { name: 'title', label: 'Title', type: 'text', required: false },
          { name: 'phone', label: 'Phone', type: 'tel', required: false },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'leadSource', label: 'Lead Source', type: 'select', options: leadSourceOptions, required: true },
          { name: 'leadStatus', label: 'Lead Status', type: 'select', options: [
            'Attempted to Contact', 'Contact in Future', 'Contacted', 'Junk Lead',
            'Lost Lead', 'Not Contacted', 'Prequalified', 'Not Qualified'
          ], required: true },
          { name: 'street', label: 'Street', type: 'text', required: false, group: 'address' },
          { name: 'area', label: 'Area', type: 'text', required: false, group: 'address' },
          { name: 'city', label: 'City', type: 'text', required: false, group: 'address' },
          { name: 'state', label: 'State', type: 'text', required: false, group: 'address' },
          { name: 'country', label: 'Country', type: 'text', required: false, group: 'address' },
          { name: 'zipCode', label: 'ZIP Code', type: 'text', required: false, group: 'address' },
          { name: 'description', label: 'Description', type: 'textarea', required: false, group: 'description' }
        ];
      case 'task':
        return [
          { name: 'taskOwner', label: 'Task Owner', type: 'text', required: true },
          { name: 'subject', label: 'Subject', type: 'text', required: true },
          { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
          { name: 'status', label: 'Status', type: 'select', options: [
            'Deferred', 'Not Started', 'In Progress', 'Completed', 'Waiting for Input'
          ], required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: false, group: 'description' }
        ];
      case 'deal':
        return [
          { name: 'dealOwner', label: 'Deal Owner', type: 'text', required: true },
          { name: 'dealName', label: 'Deal Name', type: 'text', required: true },
          { name: 'leadSource', label: 'Lead Source', type: 'select', options: leadSourceOptions, required: true },
          { name: 'stage', label: 'Stage', type: 'select', options: [
            'Need Analysis', 'Value Proposition', 'Identify Decision Makers',
            'Negotiation/Review', 'Closed Won', 'Closed Lost', 'Closed Lost to Competition'
          ], required: true },
          { name: 'amount', label: 'Amount', type: 'number', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: false, group: 'description' }
        ];
      case 'contact':
        return [
          { name: 'contactOwner', label: 'Contact Owner', type: 'text', required: true },
          { name: 'firstName', label: 'First Name', type: 'text', required: true },
          { name: 'accountName', label: 'Account Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone', type: 'tel', required: false },
          { name: 'leadSource', label: 'Lead Source', type: 'select', options: leadSourceOptions, required: true },
          { name: 'title', label: 'Title', type: 'text', required: false },
          { name: 'department', label: 'Department', type: 'text', required: false },
          { name: 'street', label: 'Street', type: 'text', required: false, group: 'address' },
          { name: 'area', label: 'Area', type: 'text', required: false, group: 'address' },
          { name: 'city', label: 'City', type: 'text', required: false, group: 'address' },
          { name: 'state', label: 'State', type: 'text', required: false, group: 'address' },
          { name: 'country', label: 'Country', type: 'text', required: false, group: 'address' },
          { name: 'zipCode', label: 'ZIP Code', type: 'text', required: false, group: 'address' },
          { name: 'description', label: 'Description', type: 'textarea', required: false, group: 'description' }
        ];
      case 'dealer':
        return [
          { name: 'name', label: 'Dealer Name', type: 'text', required: true },
          { name: 'contact', label: 'Contact Info', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: false },
          { name: 'address', label: 'Address', type: 'text', required: false },
          { name: 'subsidiary', label: 'Assigned Subsidiary', type: 'text', required: false },
          { name: 'description', label: 'Description', type: 'textarea', required: false, group: 'description' }
        ];
      case 'subsidiary':
        return [
          { name: 'name', label: 'Subsidiary Name', type: 'text', required: true },
          { name: 'address', label: 'Address', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: false },
          { name: 'contact', label: 'Contact Number', type: 'text', required: false },
          { name: 'totalEmployees', label: 'Total Employees', type: 'number', required: false },
          { name: 'description', label: 'Description', type: 'textarea', required: false, group: 'description' }
        ];
      default:
        return [];
    }
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const baseRecord = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    switch (selectedType) {
      case 'lead':
        addLead({
          ...baseRecord,
          name: `${formData.firstName} ${formData.lastName}`,
          company: formData.company,
          email: formData.email,
          phone: formData.phone || '',
          status: 'New',
          source: formData.leadSource || 'Direct',
          value: 0
        });
        break;
      case 'contact':
        addContact({
          ...baseRecord,
          name: formData.firstName,
          email: formData.email,
          phone: formData.phone || '',
          company: formData.accountName,
          position: formData.title || '',
          status: 'Active'
        });
        break;
      case 'deal':
        addDeal({
          ...baseRecord,
          name: formData.dealName,
          account: formData.account || 'Unknown',
          value: formData.amount || 0,
          stage: 'Prospecting',
          probability: 25,
          closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          owner: formData.dealOwner || 'Current User'
        });
        break;
      case 'task':
        addTask({
          ...baseRecord,
          title: formData.subject,
          description: formData.description || '',
          priority: 'Medium',
          status: 'Open',
          dueDate: formData.dueDate,
          assignee: formData.taskOwner || 'Current User',
          type: 'Follow-up'
        });
        break;
      case 'dealer':
        addDealer?.({
          ...baseRecord,
          name: formData.name,
          email: formData.email || '',
          phone: formData.contact || '',
          company: formData.name,
          location: formData.address || '',
          territory: formData.subsidiary || '',
          status: 'Active',
          tenantId: '',
          updatedAt: baseRecord.createdAt
        });
        break;
      case 'subsidiary':
        addSubsidiary?.({
          ...baseRecord,
          name: formData.name,
          email: formData.email || '',
          address: formData.address,
          contact: formData.contact || '',
          totalEmployees: formData.totalEmployees || 0,
          tenantId: '',
          updatedAt: baseRecord.createdAt
        });
        break;
    }

    console.log(`Created new ${selectedType}`);
    setFormData({});
    setSelectedType('');
    handleMainModalClose();
  };

  const formFields = getFormFields();

  // Group fields by their 'group' property
  const groupedFields = formFields.reduce((acc, field) => {
    const group = field.group || 'default';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, typeof formFields>);

  return (
    <>
      <Dialog open={isOpen && !showUserModal} onClose={handleMainModalClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Add New Record
            </Dialog.Title>
            <button
              onClick={handleMainModalClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icons.X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            {!selectedType ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What would you like to create?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {recordTypes.map((type) => {
                    const Icon = Icons[type.icon as keyof typeof Icons] as any;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleTypeSelection(type.id)}
                        className="p-4 border-2 border-gray-200 rounded-lg text-left hover:border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center mb-2">
                          <Icon className="w-5 h-5 text-gray-600 mr-2" />
                          <span className="font-medium text-gray-900">{type.name}</span>
                        </div>
                        <p className="text-xs text-gray-600">{type.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={handleBackToSelection}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                  >
                    <Icons.ArrowLeft className="w-4 h-4 mr-1" />
                    Back to selection
                  </button>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Create New {recordTypes.find(t => t.id === selectedType)?.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Fill in the details below to create a new {selectedType}.
                  </p>
                </div>

                {/* Render fields grouped by sections */}
                {Object.entries(groupedFields).map(([group, fields]) => (
                  <div key={group} className="mb-6">
                    {group !== 'default' && (
                      <h4 className="text-md font-semibold text-gray-800 mb-3">
                        {group === 'address' ? 'Address Information' : 'Description Information'}
                      </h4>
                    )}
                    <div className={`grid ${group === 'address' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                      {fields.map((field) => (
                        <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {field.type === 'select' ? (
                            <select
                              value={formData[field.name] || ''}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                              required={field.required}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select {field.label}</option>
                              {field.options?.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : field.type === 'textarea' ? (
                            <textarea
                              rows={3}
                              value={formData[field.name] || ''}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                              required={field.required}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={`Enter ${field.label.toLowerCase()}...`}
                            />
                          ) : field.type === 'tel' ? (
                            <PhoneNumberInput
                              value={formData[field.name] || ''}
                              onChange={(phoneNumber) => handleInputChange(field.name, phoneNumber)}
                              placeholder={`Enter ${field.label.toLowerCase()}...`}
                              className="w-full"
                            />
                          ) : (
                            <input
                              type={field.type}
                              value={formData[field.name] || ''}
                              onChange={(e) => handleInputChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                              required={field.required}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={`Enter ${field.label.toLowerCase()}...`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {selectedType && (
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleMainModalClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create {recordTypes.find(t => t.id === selectedType)?.name}
                </button>
              </div>
            )}
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>

    <AddNewUserModal
      isOpen={showUserModal}
      onClose={handleUserModalClose}
      onUserAdded={handleUserAdded}
    />
    </>
  );
};

export default AddNewModal;
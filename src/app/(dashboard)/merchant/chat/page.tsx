'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '../../../../lib/supabase/client';
import { Send, User, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

// Define types
interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Customer {
  id: string;
  full_name: string;
  email: string;
}

interface OrderWithCustomer {
  customer: Customer;
}

export default function MerchantChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchCustomers();
    setupRealtimeSubscription();

    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchMessages();
      scrollToBottom();
    }
  }, [selectedCustomer]);

  async function fetchCustomers() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get unique customers who have ordered from this merchant
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        customer:customer_id (
          id,
          full_name,
          email
        )
      `)
      .eq('merchant_id', user.id) as {
        data: OrderWithCustomer[] | null;
        error: any;
      };

    if (orders && orders.length > 0) {
      const uniqueCustomers = Array.from(
        new Map(orders.map((order: OrderWithCustomer) => [order.customer.id, order.customer])).values()
      );
      setCustomers(uniqueCustomers);
    } else {
      setCustomers([]);
    }
    setLoading(false);
  }

  async function fetchMessages() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedCustomer) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedCustomer}),and(sender_id.eq.${selectedCustomer},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true }) as {
        data: Message[] | null;
        error: any;
      };

    if (data) {
      setMessages(data);
      
      // Mark messages as read
      const unreadMessages = data.filter(m => m.receiver_id === user.id && !m.is_read);
      for (const msg of unreadMessages) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('id', msg.id);
      }
    }
  }

  function setupRealtimeSubscription() {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMessage = payload.new as Message;
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user && selectedCustomer && 
              ((newMessage.sender_id === selectedCustomer && newMessage.receiver_id === user.id) ||
               (newMessage.sender_id === user.id && newMessage.receiver_id === selectedCustomer))) {
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedCustomer) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: selectedCustomer,
        message: newMessage.trim(),
        is_read: false
      });

    if (error) {
      toast.error('Failed to send message');
    } else {
      setNewMessage('');
      scrollToBottom();
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[calc(100vh-120px)]">
      <div className="flex h-full">
        {/* Customers Sidebar */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Customers</h2>
            <p className="text-sm text-gray-600">Chat with your customers</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {customers.length === 0 ? (
              <div className="p-8 text-center">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No customers yet</p>
                <p className="text-sm text-gray-400">Orders will appear here</p>
              </div>
            ) : (
              customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedCustomer === customer.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.full_name}</p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedCustomer ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {customers.find(c => c.id === selectedCustomer)?.full_name}
                  </h3>
                  <p className="text-sm text-gray-500">Customer</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isSender = message.sender_id !== selectedCustomer;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isSender
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p>{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        isSender ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a customer</h3>
              <p className="text-gray-500">Choose a customer from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
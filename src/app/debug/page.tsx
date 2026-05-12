'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function DebugPage() {
  const [data, setData] = useState<any>({});
  const supabase = createClient();

  useEffect(() => {
    async function debug() {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      const { data: merchant } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      setData({
        user,
        profile,
        merchant,
        hasMerchant: !!merchant
      });
    }
    
    debug();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
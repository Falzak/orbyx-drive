
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const StorageQuota = () => {
  const { data: quotaInfo, isLoading } = useQuery({
    queryKey: ['storage-quota'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_quotas')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-2 bg-muted rounded w-full"></div>
      </div>
    );
  }

  if (!quotaInfo) return null;

  const usedPercentage = (quotaInfo.used_quota / quotaInfo.total_quota) * 100;
  const usedGB = (quotaInfo.used_quota / (1024 * 1024 * 1024)).toFixed(2);
  const totalGB = (quotaInfo.total_quota / (1024 * 1024 * 1024)).toFixed(2);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Storage Used</span>
        <span>
          {usedGB}GB / {totalGB}GB
        </span>
      </div>
      <Progress
        value={usedPercentage}
        className={`h-2 ${usedPercentage > 90 ? "bg-destructive" : "bg-primary"}`}
      />
    </div>
  );
};

export default StorageQuota;

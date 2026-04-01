import * as React from 'react';
import { Share } from 'react-native';
import { Text, TouchableOpacity } from '@/components/ui';

type LogExportButtonProps = {
  getExportData: () => string;
};

export function LogExportButton({ getExportData }: LogExportButtonProps) {
  const handleExport = async () => {
    const data = getExportData();
    try {
      await Share.share({
        message: data,
        title: 'App Logs',
      });
    }
    catch {
      // Share cancelled or failed
    }
  };

  return (
    <TouchableOpacity
      onPress={handleExport}
      className="rounded-lg bg-blue-500 px-4 py-2"
    >
      <Text className="text-sm font-medium text-white">Export Logs</Text>
    </TouchableOpacity>
  );
}

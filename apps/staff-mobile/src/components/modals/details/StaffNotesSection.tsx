import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { AlertCircle, CheckCircle } from '../../common/Icons';

interface StaffNotesSectionProps {
  initialNotes?: string;
  onSaveNotes: (notes: string) => void;
}

export const StaffNotesSection: React.FC<StaffNotesSectionProps> = ({ initialNotes = '', onSaveNotes }) => {
  const [notes, setNotes] = useState<string>(initialNotes);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSave = () => {
    onSaveNotes(notes.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <View className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 mb-3 space-y-2.5">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <AlertCircle size={14} color="#f59e0b" />
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Counter Staff Notes
          </Text>
        </View>
        {isSaved && (
          <View className="flex-row items-center gap-1">
            <CheckCircle size={12} color="#34d399" />
            <Text className="text-[10px] text-emerald-400 font-semibold">Saved</Text>
          </View>
        )}
      </View>

      <View className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-700/80">
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Add counter intake or pickup notes..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={2}
          className="text-xs text-white"
        />
      </View>

      {notes !== initialNotes && (
        <TouchableOpacity
          onPress={handleSave}
          className="bg-slate-700 active:bg-slate-600 py-1.5 rounded-lg items-center self-end px-3"
        >
          <Text className="text-xs font-semibold text-white">Save Note</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

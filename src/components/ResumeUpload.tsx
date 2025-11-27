import { useState, useRef } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ResumeUploadProps {
  onUploadComplete?: () => void;
}

export const ResumeUpload = ({ onUploadComplete }: ResumeUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast({
        title: "نوع الملف غير صحيح",
        description: "يرجى رفع ملف PDF فقط",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "حجم الملف كبير جداً",
        description: "يجب أن يكون حجم الملف أقل من 10 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create candidate record first
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .insert({
          full_name: 'معالجة...',
          status: 'pending',
        })
        .select()
        .single();

      if (candidateError) throw candidateError;

      // Upload file to storage
      const fileName = `${candidate.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Update candidate with file info
      const { error: updateError } = await supabase
        .from('candidates')
        .update({
          resume_url: fileName,
          resume_filename: file.name,
        })
        .eq('id', candidate.id);

      if (updateError) throw updateError;

      // Trigger AI analysis
      const { error: analysisError } = await supabase.functions.invoke('analyze-resume', {
        body: {
          resumeUrl: fileName,
          candidateId: candidate.id,
        },
      });

      if (analysisError) throw analysisError;

      toast({
        title: "تم رفع السيرة الذاتية بنجاح",
        description: "جاري تحليل المعلومات...",
      });

      onUploadComplete?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "فشل رفع الملف",
        description: error.message || "حدث خطأ أثناء رفع الملف",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 shadow-card hover:shadow-hover ${
        dragActive ? 'border-primary ring-2 ring-primary' : ''
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 rounded-full bg-gradient-hero">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-white" />
            )}
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {uploading ? 'جاري رفع السيرة الذاتية...' : 'رفع سيرة ذاتية جديدة'}
            </h3>
            <p className="text-sm text-muted-foreground">
              اسحب وأفلت ملف PDF هنا، أو انقر للاختيار
            </p>
            <p className="text-xs text-muted-foreground">
              الحد الأقصى: 10 ميجابايت
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleChange}
            className="hidden"
            disabled={uploading}
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-gradient-hero hover:opacity-90 transition-opacity"
          >
            <FileText className="w-4 h-4 mr-2" />
            اختر ملف PDF
          </Button>
        </div>
      </div>
    </Card>
  );
};
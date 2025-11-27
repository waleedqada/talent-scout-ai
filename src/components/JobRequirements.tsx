import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Briefcase, X, Loader2, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface JobRequirementsProps {
  onJobSelect?: (jobId: string) => void;
  selectedJobId?: string;
}

export const JobRequirements = ({ onJobSelect, selectedJobId }: JobRequirementsProps) => {
  const [open, setOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [requiredYears, setRequiredYears] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['job-requirements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_requirements')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleAddSkill = () => {
    if (currentSkill.trim() && !requiredSkills.includes(currentSkill.trim())) {
      setRequiredSkills([...requiredSkills, currentSkill.trim()]);
      setCurrentSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobTitle.trim() || requiredSkills.length === 0) {
      toast({
        title: "معلومات ناقصة",
        description: "يرجى إدخال عنوان الوظيفة والمهارات المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('job_requirements').insert({
        job_title: jobTitle,
        description: description || null,
        required_skills: requiredSkills,
        required_experience_years: requiredYears ? parseInt(requiredYears) : null,
      });

      if (error) throw error;

      toast({
        title: "تم إضافة الوظيفة بنجاح",
        description: "يمكنك الآن تصنيف المرشحين لهذه الوظيفة",
      });

      // Reset form
      setJobTitle("");
      setDescription("");
      setRequiredSkills([]);
      setCurrentSkill("");
      setRequiredYears("");
      setOpen(false);
      refetch();
    } catch (error: any) {
      console.error('Error adding job:', error);
      toast({
        title: "فشل إضافة الوظيفة",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          متطلبات الوظائف
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-hero hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4 mr-2" />
              إضافة وظيفة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة وظيفة جديدة</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل الوظيفة والمهارات المطلوبة
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">عنوان الوظيفة *</label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="مثال: مطور Full Stack"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">الوصف</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف مختصر للوظيفة..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">سنوات الخبرة المطلوبة</label>
                <Input
                  type="number"
                  value={requiredYears}
                  onChange={(e) => setRequiredYears(e.target.value)}
                  placeholder="مثال: 3"
                  min="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">المهارات المطلوبة *</label>
                <div className="flex gap-2">
                  <Input
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    placeholder="أدخل مهارة..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddSkill} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {requiredSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="pl-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="mr-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  'حفظ الوظيفة'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!jobs || jobs.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد وظائف مضافة حتى الآن</p>
            <p className="text-sm mt-2">أضف وظيفة جديدة لبدء تصنيف المرشحين</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-hover ${
                selectedJobId === job.id ? 'ring-2 ring-primary shadow-hover' : ''
              }`}
              onClick={() => onJobSelect?.(job.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{job.job_title}</h4>
                  {job.required_experience_years && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.required_experience_years} سنوات خبرة
                    </p>
                  )}
                </div>
                <Briefcase className="w-5 h-5 text-primary" />
              </div>

              {job.description && (
                <p className="text-sm text-muted-foreground mb-3">{job.description}</p>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">المهارات المطلوبة:</p>
                <div className="flex flex-wrap gap-1">
                  {job.required_skills?.map((skill: string) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
import { useState } from "react";
import { ResumeUpload } from "@/components/ResumeUpload";
import { CandidatesTable } from "@/components/CandidatesTable";
import { JobRequirements } from "@/components/JobRequirements";
import { RankingsTable } from "@/components/RankingsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Briefcase, Trophy, Upload } from "lucide-react";

const Index = () => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center space-y-4">
          <div className="inline-block p-3 rounded-2xl bg-gradient-hero mb-4">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            منصة تحليل السير الذاتية
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            قم برفع السير الذاتية وتحليلها تلقائياً باستخدام الذكاء الاصطناعي، ثم صنّف المرشحين بناءً على متطلبات الوظيفة
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-2/3 mx-auto shadow-card">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">رفع السير</span>
            </TabsTrigger>
            <TabsTrigger value="candidates" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">المرشحون</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">الوظائف</span>
            </TabsTrigger>
            <TabsTrigger value="rankings" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">التصنيف</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6 animate-in fade-in duration-500">
            <ResumeUpload onUploadComplete={() => setActiveTab("candidates")} />
          </TabsContent>

          <TabsContent value="candidates" className="space-y-6 animate-in fade-in duration-500">
            <CandidatesTable />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6 animate-in fade-in duration-500">
            <JobRequirements
              onJobSelect={(jobId) => {
                setSelectedJobId(jobId);
                setActiveTab("rankings");
              }}
              selectedJobId={selectedJobId || undefined}
            />
          </TabsContent>

          <TabsContent value="rankings" className="space-y-6 animate-in fade-in duration-500">
            <RankingsTable jobRequirementId={selectedJobId} />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>منصة تحليل وتصنيف المرشحين بالذكاء الاصطناعي</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
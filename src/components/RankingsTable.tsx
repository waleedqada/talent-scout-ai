import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Loader2, Target, Award, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RankingsTableProps {
  jobRequirementId: string | null;
}

export const RankingsTable = ({ jobRequirementId }: RankingsTableProps) => {
  const [ranking, setRanking] = useState(false);
  const { toast } = useToast();

  const { data: rankings, isLoading, refetch } = useQuery({
    queryKey: ['rankings', jobRequirementId],
    queryFn: async () => {
      if (!jobRequirementId) return null;

      const { data, error } = await supabase
        .from('candidate_rankings')
        .select(`
          *,
          candidates(*)
        `)
        .eq('job_requirement_id', jobRequirementId)
        .order('match_score', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!jobRequirementId,
  });

  const handleRankCandidates = async () => {
    if (!jobRequirementId) return;

    setRanking(true);

    try {
      const { error } = await supabase.functions.invoke('rank-candidates', {
        body: {
          jobRequirementId,
        },
      });

      if (error) throw error;

      toast({
        title: "تم تصنيف المرشحين بنجاح",
        description: "تم تحديث التصنيفات بناءً على المتطلبات",
      });

      refetch();
    } catch (error: any) {
      console.error('Ranking error:', error);
      toast({
        title: "فشل التصنيف",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRanking(false);
    }
  };

  if (!jobRequirementId) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>اختر وظيفة لعرض التصنيفات</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-success">ممتاز - {score}%</Badge>;
    } else if (score >= 60) {
      return <Badge className="bg-primary">جيد - {score}%</Badge>;
    } else if (score >= 40) {
      return <Badge className="bg-warning">متوسط - {score}%</Badge>;
    } else {
      return <Badge variant="destructive">ضعيف - {score}%</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          تصنيف المرشحين
        </h3>
        <Button
          onClick={handleRankCandidates}
          disabled={ranking}
          className="bg-accent hover:bg-accent/90"
        >
          {ranking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              جاري التصنيف...
            </>
          ) : (
            <>
              <Award className="w-4 h-4 mr-2" />
              تصنيف المرشحين
            </>
          )}
        </Button>
      </div>

      {!rankings || rankings.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد تصنيفات حتى الآن</p>
            <p className="text-sm mt-2">انقر على "تصنيف المرشحين" لبدء التصنيف</p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">الترتيب</TableHead>
                  <TableHead className="font-semibold">اسم المرشح</TableHead>
                  <TableHead className="font-semibold">نسبة التطابق</TableHead>
                  <TableHead className="font-semibold">المهارات المتطابقة</TableHead>
                  <TableHead className="font-semibold">المهارات الناقصة</TableHead>
                  <TableHead className="font-semibold">التوصية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.map((ranking, index) => (
                  <TableRow key={ranking.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {index === 0 && <Trophy className="w-5 h-5 text-accent" />}
                        <span className="font-bold text-lg">#{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {ranking.candidates?.full_name}
                    </TableCell>
                    <TableCell>{getScoreBadge(ranking.match_score || 0)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {ranking.matched_skills?.slice(0, 3).map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {ranking.matched_skills && ranking.matched_skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{ranking.matched_skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {ranking.missing_skills?.slice(0, 3).map((skill: string) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {ranking.missing_skills && ranking.missing_skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{ranking.missing_skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground max-w-md">
                        {ranking.recommendation}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
};
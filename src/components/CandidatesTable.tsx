import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, User, Mail, Phone, MapPin, Briefcase, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const CandidatesTable = () => {
  const { data: candidates, isLoading, refetch } = useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          *,
          candidate_skills(*),
          work_experiences(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (!candidates || candidates.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد سير ذاتية حتى الآن</p>
          <p className="text-sm mt-2">ابدأ برفع سيرة ذاتية جديدة</p>
        </div>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'analyzed':
        return <Badge className="bg-success">تم التحليل</Badge>;
      case 'pending':
        return <Badge variant="outline">قيد المعالجة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">الاسم</TableHead>
              <TableHead className="font-semibold">البريد الإلكتروني</TableHead>
              <TableHead className="font-semibold">الهاتف</TableHead>
              <TableHead className="font-semibold">الموقع</TableHead>
              <TableHead className="font-semibold">سنوات الخبرة</TableHead>
              <TableHead className="font-semibold">الحالة</TableHead>
              <TableHead className="font-semibold">تفاصيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow key={candidate.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{candidate.full_name}</TableCell>
                <TableCell>
                  {candidate.email ? (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{candidate.email}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {candidate.phone ? (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{candidate.phone}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {candidate.location ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{candidate.location}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {candidate.years_of_experience ? (
                    <Badge variant="secondary">
                      {candidate.years_of_experience} سنة
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        عرض التفاصيل
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">{candidate.full_name}</DialogTitle>
                        <DialogDescription>
                          {getStatusBadge(candidate.status)}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6 mt-4">
                        {candidate.summary && (
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              نبذة مختصرة
                            </h4>
                            <p className="text-sm text-muted-foreground">{candidate.summary}</p>
                          </div>
                        )}

                        {candidate.education && (
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Award className="w-4 h-4" />
                              التعليم
                            </h4>
                            <p className="text-sm text-muted-foreground">{candidate.education}</p>
                          </div>
                        )}

                        {candidate.candidate_skills && candidate.candidate_skills.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">المهارات</h4>
                            <div className="flex flex-wrap gap-2">
                              {candidate.candidate_skills.map((skill: any) => (
                                <Badge key={skill.id} variant="secondary">
                                  {skill.skill_name}
                                  {skill.proficiency_level && (
                                    <span className="mr-1 text-xs opacity-70">
                                      ({skill.proficiency_level})
                                    </span>
                                  )}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {candidate.work_experiences && candidate.work_experiences.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Briefcase className="w-4 h-4" />
                              الخبرات العملية
                            </h4>
                            <div className="space-y-4">
                              {candidate.work_experiences.map((exp: any) => (
                                <Card key={exp.id} className="p-4">
                                  <h5 className="font-medium">{exp.position}</h5>
                                  <p className="text-sm text-muted-foreground">{exp.company_name}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {exp.start_date} - {exp.end_date}
                                  </p>
                                  {exp.description && (
                                    <p className="text-sm mt-2">{exp.description}</p>
                                  )}
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
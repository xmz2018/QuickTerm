import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { History, Search, Filter, Calendar, Tag, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QueryResult {
  timestamp: string;
  query: string;
  result: string;
  category?: string;
}

interface HistoryPanelProps {
  queries: QueryResult[];
  onDeleteQuery: (timestamp: string) => void;
  onExportData: () => void;
}

export const HistoryPanel = ({ queries, onDeleteQuery, onExportData }: HistoryPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedQuery, setSelectedQuery] = useState<QueryResult | null>(null);
  const { toast } = useToast();

  // 获取所有分类
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    queries.forEach(query => {
      if (query.category) {
        categorySet.add(query.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [queries]);

  // 过滤查询记录
  const filteredQueries = useMemo(() => {
    return queries.filter(query => {
      const matchesSearch = !searchTerm || 
        query.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.result.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        (selectedCategory === 'uncategorized' && !query.category) ||
        query.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [queries, searchTerm, selectedCategory]);

  const handleDeleteQuery = (timestamp: string) => {
    onDeleteQuery(timestamp);
    if (selectedQuery?.timestamp === timestamp) {
      setSelectedQuery(null);
    }
    toast({
      title: "已删除",
      description: "查询记录已删除",
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-medium">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <History className="h-5 w-5 text-primary" />
            查询历史
            <Badge variant="secondary" className="ml-auto">
              共 {queries.length} 条记录
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 搜索和筛选 */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索查询内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-input/70 focus:border-primary transition-colors duration-300"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="分类筛选" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                <SelectItem value="uncategorized">未分类</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={onExportData}
              variant="outline"
              className="min-w-[100px]"
            >
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 查询列表 */}
        <Card className="shadow-soft">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">查询记录</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredQueries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <div>暂无匹配的查询记录</div>
                </div>
              ) : (
                filteredQueries.map((query) => (
                  <div
                    key={query.timestamp}
                    className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                      selectedQuery?.timestamp === query.timestamp
                        ? 'border-primary bg-primary/5 shadow-medium'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }`}
                    onClick={() => setSelectedQuery(query)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm mb-1 truncate">
                          {query.query}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(query.timestamp)}
                        </div>
                        {query.category && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {query.category}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuery(query.timestamp);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 详细内容 */}
        <Card className="shadow-soft">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">详细内容</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedQuery ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground font-medium">查询词汇</div>
                  <div className="text-foreground bg-muted/50 p-3 rounded-md">
                    {selectedQuery.query}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground font-medium">查询时间</div>
                  <div className="text-sm text-foreground">
                    {formatDate(selectedQuery.timestamp)}
                  </div>
                </div>

                {selectedQuery.category && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground font-medium">分类标签</div>
                    <Badge variant="secondary" className="bg-accent text-accent-foreground">
                      <Tag className="h-3 w-3 mr-1" />
                      {selectedQuery.category}
                    </Badge>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground font-medium">解释内容</div>
                  <Textarea
                    value={selectedQuery.result}
                    readOnly
                    className="min-h-[200px] bg-muted/30 border-border/50 resize-none"
                  />
                </div>

                <Button
                  onClick={() => handleDeleteQuery(selectedQuery.timestamp)}
                  variant="outline"
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除此记录
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <div className="mb-3">请选择一条查询记录查看详细内容</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
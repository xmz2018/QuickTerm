import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Check, X, Sparkles, Clock, Tag, RefreshCw, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { QueryResult, APISettings } from '@/lib/types';

interface QueryInterfaceProps {
  apiSettings: APISettings;
  onResultSave: (result: QueryResult) => void;
  recentQueries: QueryResult[];
  tempQuery: string;
  setTempQuery: (query: string) => void;
  tempQueryResult: string;
  setTempQueryResult: (result: string) => void;
  tempCategory: string;
  setTempCategory: (category: string) => void;
  presetCategories: string[];
}



export const QueryInterface = ({
  apiSettings,
  onResultSave,
  recentQueries,
  tempQuery: query,
  setTempQuery: setQuery,
  tempQueryResult: result,
  setTempQueryResult: setResult,
  tempCategory: category,
  setTempCategory: setCategory,
  presetCategories,
}: QueryInterfaceProps) => {
  const [isQuerying, setIsQuerying] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false); // For category refresh
  const [showResult, setShowResult] = useState(false);
  const { toast } = useToast();

  const performQuery = useCallback(async () => {
    if (!query.trim()) {
      toast({
        title: "请输入查询内容",
        description: "请输入您想查询的名词或概念",
        variant: "destructive",
      });
      return;
    }

    if (!apiSettings.queryApiUrl || !apiSettings.queryApiKey) {
      toast({
        title: "API 未配置",
        description: "请先在设置中配置查询 API",
        variant: "destructive",
      });
      return;
    }

    setIsQuerying(true);
    setShowResult(false);

    try {
      // 查询主内容
      const queryResponse = await fetch(apiSettings.queryApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiSettings.queryApiKey}`,
        },
        body: JSON.stringify({
          model: apiSettings.queryModel || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: apiSettings.queryPrompt || '你是一个专业的知识助手。请用简洁明了的语言解释用户询问的名词或概念，包括定义、主要特点和应用场景。回答要准确、有条理。'
            },
            {
              role: 'user',
              content: `请解释：${query}`
            }
          ],
          max_tokens: 500,
          temperature: 0.35,
        }),
      });

      if (!queryResponse.ok) {
        throw new Error('查询请求失败');
      }

      const queryData = await queryResponse.json();
      const resultText = queryData.choices?.[0]?.message?.content || '查询结果为空';
      setResult(resultText);

      // 如果启用了分类功能，进行分类
      let categoryText = '';
      if (apiSettings.categoryEnabled && apiSettings.categoryApiUrl && apiSettings.categoryApiKey && apiSettings.predefinedCategories.length > 0) {
        try {
          const categoriesText = apiSettings.predefinedCategories.join('、');
          const categoryResponse = await fetch(apiSettings.categoryApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiSettings.categoryApiKey}`,
            },
            body: JSON.stringify({
              model: apiSettings.categoryModel || 'gpt-3.5-turbo',
              messages: [
                {
                  role: 'system',
                  content: (apiSettings.categoryPrompt || '你是一个分类专家。请从以下预设分类中选择一个最合适的分类：{categories}。只返回一个分类词汇，不要解释。如果没有合适的分类，返回"其他"。').replace('{categories}', categoriesText)
                },
                {
                  role: 'user',
                  content: `请为"${query}"选择最合适的分类`
                }
              ],
              max_tokens: 10,
              temperature: 0.1,
            }),
          });

          if (categoryResponse.ok) {
            const categoryData = await categoryResponse.json();
            const rawCategory = categoryData.choices?.[0]?.message?.content?.trim() || '';
            // 验证返回的分类是否在预设列表中
            if (apiSettings.predefinedCategories.includes(rawCategory)) {
              categoryText = rawCategory;
            } else {
              // 如果不在预设列表中，尝试模糊匹配
              const matchedCategory = apiSettings.predefinedCategories.find(cat => 
                rawCategory.includes(cat) || cat.includes(rawCategory)
              );
              categoryText = matchedCategory || '其他';
            }
          }
        } catch (error) {
          console.warn('分类请求失败:', error);
        }
      }

      setCategory(categoryText);
      setShowResult(true);
      
      toast({
        title: "查询成功",
        description: "已获取查询结果，请确认是否保存",
      });

    } catch (error) {
      console.error('查询失败:', error);
      toast({
        title: "查询失败",
        description: error instanceof Error ? error.message : "网络错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsQuerying(false);
    }
  }, [query, apiSettings, toast, setCategory]);

  const handleConfirm = useCallback(() => {
    const newResult: QueryResult = {
      timestamp: new Date().toISOString(),
      query: query.trim(),
      result,
      category: category || undefined,
    };

    onResultSave(newResult);
    
    // 清空当前结果
    // Clear the temporary query state in the parent component
    setQuery('');
    setResult('');
    setCategory('');
    setShowResult(false);
    
    toast({
      title: "已保存",
      description: "查询结果已保存到历史记录",
    });
  }, [query, result, category, onResultSave, toast, setQuery, setResult, setCategory]);

  const refreshCategory = useCallback(async () => {
    if (!query.trim() || !apiSettings.categoryEnabled || !apiSettings.categoryApiUrl || !apiSettings.categoryApiKey || apiSettings.predefinedCategories.length === 0) {
      return;
    }

    setIsCategorizing(true);

    try {
      const categoriesText = apiSettings.predefinedCategories.join('、');
      const categoryResponse = await fetch(apiSettings.categoryApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiSettings.categoryApiKey}`,
        },
        body: JSON.stringify({
          model: apiSettings.categoryModel || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: (apiSettings.categoryPrompt || '你是一个分类专家。请从以下预设分类中选择一个最合适的分类：{categories}。只返回一个分类词汇，不要解释。如果没有合适的分类，返回"其他"。').replace('{categories}', categoriesText)
            },
            {
              role: 'user',
              content: `请为"${query}"选择最合适的分类`
            }
          ],
          max_tokens: 10,
          temperature: 0.1,
        }),
      });

      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json();
        const rawCategory = categoryData.choices?.[0]?.message?.content?.trim() || '';
        // 验证返回的分类是否在预设列表中
        if (apiSettings.predefinedCategories.includes(rawCategory)) {
          setCategory(rawCategory);
        } else {
          // 如果不在预设列表中，尝试模糊匹配
          const matchedCategory = apiSettings.predefinedCategories.find(cat => 
            rawCategory.includes(cat) || cat.includes(rawCategory)
          );
          setCategory(matchedCategory || '其他');
        }
        
        toast({
          title: "分类已刷新",
          description: "分类已重新识别",
        });
      }
    } catch (error) {
      console.error('分类刷新失败:', error);
      toast({
        title: "分类刷新失败",
        description: "无法刷新分类，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsCategorizing(false);
    }
  }, [query, apiSettings, toast]);

  const handleDiscard = useCallback(() => {
    setResult('');
    setCategory('');
    setShowResult(false);
    toast({
      title: "已丢弃",
      description: "查询结果已丢弃",
    });
  }, [toast, setResult, setCategory]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      performQuery();
    }
  }, [performQuery]);

  return (
    <div className="space-y-6">
      {/* 查询界面 */}
      <Card className="shadow-medium hover:shadow-large transition-all duration-300 border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            知识查询
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="输入您想查询的名词或概念..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 border-input/70 focus:border-primary focus:shadow-glow transition-all duration-300"
              disabled={isQuerying}
            />
            <Button
              onClick={performQuery}
              disabled={isQuerying || !query.trim()}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300 min-w-[100px]"
            >
              {isQuerying ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  查询中
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  查询
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 查询结果 */}
      {showResult && (
        <Card className="shadow-medium border-primary/20 animate-slide-up">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">查询结果</CardTitle>
              {category && (
                 <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="bg-accent text-accent-foreground">
                    <Tag className="h-3 w-3 mr-1" />
                    {category}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="重新识别分类" disabled={isCategorizing} onClick={refreshCategory}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="手动修改分类">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {presetCategories.map((cat) => (
                        <DropdownMenuItem key={cat} onSelect={() => setCategory(cat)}>
                          {cat}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground font-medium">查询词汇</div>
              <div className="text-foreground bg-muted/50 p-3 rounded-md">{query}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground font-medium">解释内容</div>
              <Textarea
                value={result}
                readOnly
                // 这里我们将最小高度从120px增加到了240px，让结果显示框更高
                className="min-h-[300px] bg-muted/30 border-border/50 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-success hover:bg-success/90 text-success-foreground transition-colors duration-300"
              >
                <Check className="h-4 w-4 mr-2" />
                确认保存
              </Button>
              <Button
                onClick={handleDiscard}
                variant="outline"
                className="flex-1 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors duration-300"
              >
                <X className="h-4 w-4 mr-2" />
                丢弃
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 最近查询 */}
      {recentQueries.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-4 w-4 text-muted-foreground" />
              最近查询
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {recentQueries.slice(0, 5).map((item) => (
                <div
                  key={item.timestamp}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.query}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  {item.category && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {item.category}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
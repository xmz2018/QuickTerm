import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QueryInterface } from '@/components/QueryInterface';
import { HistoryPanel } from '@/components/HistoryPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Search, History, Settings, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { QueryResult, APISettings } from '@/lib/types';

const DEFAULT_SETTINGS: APISettings = {
  queryApiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
  queryApiKey: 'sk-nrszshlxsirtjkehhziwsqjmfthngfwsttwputniagqoichh',
  queryModel: 'deepseek-ai/DeepSeek-V3',
  categoryApiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
  categoryApiKey: 'sk-nrszshlxsirtjkehhziwsqjmfthngfwsttwputniagqoichh',
  categoryModel: 'deepseek-ai/DeepSeek-V3',
  categoryEnabled: false,
  predefinedCategories: ['技术', '科学', '历史', '文化', '商业', '医学', '艺术', '体育', '政治', '教育'],
  queryPrompt: '你是一个专业的知识助手。请用简洁明了的语言解释用户询问的名词或概念，包括定义、主要特点和应用场景。回答要准确、有条理。',
  categoryPrompt: '你是一个分类专家。请从以下预设分类中选择一个最合适的分类：{categories}。只返回一个分类词汇，不要解释。如果没有合适的分类，返回"其他"。',
};

const STORAGE_KEYS = {
  QUERIES: 'knowledge_queries',
  SETTINGS: 'api_settings',
};

const Index = () => {
  const [queries, setQueries] = useState<QueryResult[]>([]);
  const [settings, setSettings] = useState<APISettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState('query');
  const { toast } = useToast();

  // 用于暂存未确认的查询结果
  const [tempQuery, setTempQuery] = useState<string>('');
  const [tempQueryResult, setTempQueryResult] = useState<string>('');
  const [tempCategory, setTempCategory] = useState<string>('');

  // 加载本地数据
  useEffect(() => {
    try {
      const savedQueries = localStorage.getItem(STORAGE_KEYS.QUERIES);
      if (savedQueries) {
        setQueries(JSON.parse(savedQueries));
      }

      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('加载本地数据失败:', error);
      toast({
        title: "数据加载失败",
        description: "无法加载历史数据，请检查浏览器设置",
        variant: "destructive",
      });
    }
  }, [toast]);

  // 保存查询结果
  const handleResultSave = (result: QueryResult) => {
    const newQueries = [result, ...queries];
    setQueries(newQueries);
    
    try {
      localStorage.setItem(STORAGE_KEYS.QUERIES, JSON.stringify(newQueries));
    } catch (error) {
      console.error('保存查询结果失败:', error);
      toast({
        title: "保存失败",
        description: "无法保存查询结果，请检查浏览器存储空间",
        variant: "destructive",
      });
    }
  };

  // 删除查询记录
  const handleDeleteQuery = (timestamp: string) => {
    const newQueries = queries.filter(q => q.timestamp !== timestamp);
    setQueries(newQueries);
    
    try {
      localStorage.setItem(STORAGE_KEYS.QUERIES, JSON.stringify(newQueries));
    } catch (error) {
      console.error('删除查询记录失败:', error);
    }
  };

  // 导出数据
  const handleExportData = () => {
    try {
      const exportData = {
        queries,
        exportTime: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `knowledge_queries_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "导出成功",
        description: "查询数据已导出到本地文件",
      });
    } catch (error) {
      console.error('导出数据失败:', error);
      toast({
        title: "导出失败",
        description: "无法导出数据，请重试",
        variant: "destructive",
      });
    }
  };

  // 保存设置
  const handleSettingsChange = (newSettings: APISettings) => {
    setSettings(newSettings);
    
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    } catch (error) {
      console.error('保存设置失败:', error);
      toast({
        title: "保存失败",
        description: "无法保存设置，请重试",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-glow">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              智能知识查询工具
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            快速查询名词概念，自动分类整理，构建你的专属知识库
          </p>
        </div>

        {/* 主要内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8 bg-card shadow-soft">
            <TabsTrigger value="query" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              查询
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              历史
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              设置
            </TabsTrigger>
          </TabsList>

          <TabsContent value="query" className="animate-fade-in">
            <QueryInterface
              apiSettings={settings}
              onResultSave={handleResultSave}
              recentQueries={queries.slice(0, 5)}
              presetCategories={settings.predefinedCategories}
              tempQuery={tempQuery}
              setTempQuery={setTempQuery}
              tempQueryResult={tempQueryResult}
              setTempQueryResult={setTempQueryResult}
              tempCategory={tempCategory}
              setTempCategory={setTempCategory}
            />
          </TabsContent>

          <TabsContent value="history" className="animate-fade-in">
            <HistoryPanel
              queries={queries}
              onDeleteQuery={handleDeleteQuery}
              onExportData={handleExportData}
            />
          </TabsContent>

          <TabsContent value="settings" className="animate-fade-in">
            <SettingsPanel
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;

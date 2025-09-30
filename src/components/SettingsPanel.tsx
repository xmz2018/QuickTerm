import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Key, Tag, Save, RotateCcw, AlertCircle, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

import { APISettings } from '@/lib/types';

interface SettingsPanelProps {
  settings: APISettings;
  onSettingsChange: (settings: APISettings) => void;
}

const DEFAULT_SETTINGS: APISettings = {
  queryApiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
  queryApiKey: '',
  queryModel: 'deepseek-ai/DeepSeek-V3',
  categoryApiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
  categoryApiKey: '',
  categoryModel: 'deepseek-ai/DeepSeek-V3',
  categoryEnabled: false,
  predefinedCategories: ['技术', '科学', '历史', '文化', '商业', '医学', '艺术', '体育', '政治', '教育'],
  queryPrompt: '你是一个专业的知识助手。请用简洁明了的语言解释用户询问的名词或概念，包括定义、主要特点和应用场景。回答要准确、有条理。',
  categoryPrompt: '你是一个分类专家。请从以下预设分类中选择一个最合适的分类：{categories}。只返回一个分类词汇，不要解释。如果没有合适的分类，返回"其他"。',
};

export const SettingsPanel = ({ settings, onSettingsChange }: SettingsPanelProps) => {
  const [localSettings, setLocalSettings] = useState<APISettings>({
    ...settings,
    queryPrompt: settings.queryPrompt ?? '',
    categoryPrompt: settings.categoryPrompt ?? '',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSection, setActiveSection] = useState<'api' | 'category'>('api');
  const [newCategory, setNewCategory] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  const handleSettingChange = (key: keyof APISettings, value: string | boolean | string[]) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(settings));
  };

  const handleSave = () => {
    // 验证必填字段
    if (!localSettings.queryApiKey.trim()) {
      toast({
        title: "配置错误",
        description: "请填写查询 API 密钥",
        variant: "destructive",
      });
      return;
    }

    if (localSettings.categoryEnabled && !localSettings.categoryApiKey.trim()) {
      toast({
        title: "配置错误", 
        description: "分类功能已启用，请填写分类 API 密钥",
        variant: "destructive",
      });
      return;
    }

    onSettingsChange(localSettings);
    setHasChanges(false);
    
    toast({
      title: "设置已保存",
      description: "API 配置已成功保存",
    });
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
    toast({
      title: "已重置",
      description: "设置已重置为默认值",
    });
  };

  const handleResetPrompts = () => {
    setLocalSettings(prev => ({
      ...prev,
      queryPrompt: DEFAULT_SETTINGS.queryPrompt,
      categoryPrompt: DEFAULT_SETTINGS.categoryPrompt,
    }));
    setHasChanges(true);
    toast({
      title: "提示词已重置",
      description: "提示词已恢复为默认值",
    });
  };

  const handleTestConnection = async (type: 'query' | 'category') => {
    const apiUrl = type === 'query' ? localSettings.queryApiUrl : localSettings.categoryApiUrl;
    const apiKey = type === 'query' ? localSettings.queryApiKey : localSettings.categoryApiKey;
    const model = type === 'query' ? localSettings.queryModel : localSettings.categoryModel;

    if (!apiUrl || !apiKey) {
      toast({
        title: "测试失败",
        description: "请先填写 API URL 和密钥",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: 'Hello'
            }
          ],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        toast({
          title: "连接成功",
          description: `${type === 'query' ? '查询' : '分类'} API 连接正常`,
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      toast({
        title: "连接失败",
        description: `无法连接到${type === 'query' ? '查询' : '分类'} API: ${error instanceof Error ? error.message : '未知错误'}`,
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast({
        title: "输入错误",
        description: "请输入分类名称",
        variant: "destructive",
      });
      return;
    }

    if (localSettings.predefinedCategories.includes(newCategory.trim())) {
      toast({
        title: "分类已存在",
        description: "该分类已经存在",
        variant: "destructive",
      });
      return;
    }

    const newCategories = [...localSettings.predefinedCategories, newCategory.trim()];
    handleSettingChange('predefinedCategories', newCategories);
    setNewCategory('');
    
    toast({
      title: "添加成功",
      description: "新分类已添加",
    });
  };

  const handleRemoveCategory = (category: string) => {
    const newCategories = localSettings.predefinedCategories.filter(c => c !== category);
    handleSettingChange('predefinedCategories', newCategories);
    
    toast({
      title: "删除成功",
      description: "分类已删除",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-medium">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5 text-primary" />
            系统设置
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 设置导航 */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeSection === 'api' ? 'default' : 'outline'}
              onClick={() => setActiveSection('api')}
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              API 配置
            </Button>
            <Button
              variant={activeSection === 'category' ? 'default' : 'outline'}
              onClick={() => setActiveSection('category')}
              className="flex items-center gap-2"
            >
              <Tag className="h-4 w-4" />
              分类管理
            </Button>
          </div>

          {/* API 配置部分 */}
          {activeSection === 'api' && (
            <div className="space-y-6">
              {/* 查询 API 设置 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  查询 API 配置
                </h3>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="query-url">API 地址</Label>
                    <Input
                      id="query-url"
                      placeholder="https://api.openai.com/v1/chat/completions"
                      value={localSettings.queryApiUrl}
                      onChange={(e) => handleSettingChange('queryApiUrl', e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="query-model">模型名称</Label>
                    <Input
                      id="query-model"
                      placeholder="gpt-3.5-turbo"
                      value={localSettings.queryModel}
                      onChange={(e) => handleSettingChange('queryModel', e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="query-key">API 密钥</Label>
                    <div className="flex gap-2">
                      <Input
                        id="query-key"
                        type="password"
                        placeholder="sk-..."
                        value={localSettings.queryApiKey}
                        onChange={(e) => handleSettingChange('queryApiKey', e.target.value)}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        onClick={() => handleTestConnection('query')}
                        disabled={!localSettings.queryApiUrl || !localSettings.queryApiKey}
                      >
                        测试
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 使用说明 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-accent" />
                  <h3 className="text-lg font-semibold">使用说明</h3>
                </div>
                <div className="text-sm text-muted-foreground space-y-2 bg-muted/30 p-4 rounded-lg">
                  <p>• 支持 OpenAI 兼容的 API 格式</p>
                  <p>• 推荐使用 GPT-3.5-turbo 或 GPT-4 系列模型</p>
                  <p>• API 密钥将安全存储在本地浏览器中</p>
                  <p>• 可以使用不同的 API 服务商，只要兼容 OpenAI 格式</p>
                </div>
              </div>
            </div>
          )}

          {/* 分类管理部分 */}
          {activeSection === 'category' && (
            <div className="space-y-6">
              {/* 分类功能开关 */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">自动分类功能</h3>
                  <p className="text-sm text-muted-foreground">
                    启用后，AI 将从预设分类中选择最合适的标签
                  </p>
                </div>
                <Switch
                  checked={localSettings.categoryEnabled}
                  onCheckedChange={(checked) => handleSettingChange('categoryEnabled', checked)}
                />
              </div>

              {localSettings.categoryEnabled && (
                <>
                  <Separator />
                  
                  {/* 分类 API 配置 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">分类 API 配置</h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="category-url">API 地址</Label>
                        <Input
                          id="category-url"
                          placeholder="https://api.openai.com/v1/chat/completions"
                          value={localSettings.categoryApiUrl}
                          onChange={(e) => handleSettingChange('categoryApiUrl', e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category-model">模型名称</Label>
                        <Input
                          id="category-model"
                          placeholder="gpt-3.5-turbo"
                          value={localSettings.categoryModel}
                          onChange={(e) => handleSettingChange('categoryModel', e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category-key">API 密钥</Label>
                        <div className="flex gap-2">
                          <Input
                            id="category-key"
                            type="password"
                            placeholder="sk-..."
                            value={localSettings.categoryApiKey}
                            onChange={(e) => handleSettingChange('categoryApiKey', e.target.value)}
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            onClick={() => handleTestConnection('category')}
                            disabled={!localSettings.categoryApiUrl || !localSettings.categoryApiKey}
                          >
                            测试
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />
                  
                  {/* 预设分类管理 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">预设分类标签</h3>
                    
                    {/* 添加新分类 */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="输入新的分类名称..."
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCategory();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleAddCategory}
                        disabled={!newCategory.trim()}
                        className="min-w-[80px]"
                      >
                        添加
                      </Button>
                    </div>
                    
                    {/* 现有分类列表 */}
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        当前分类 ({localSettings.predefinedCategories.length} 个)
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-3 bg-muted/30 rounded-lg">
                        {localSettings.predefinedCategories.map((category, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1 pr-1"
                          >
                            {category}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveCategory(category)}
                              className="h-4 w-4 p-0 hover:bg-destructive/20 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground bg-accent/20 p-3 rounded-lg">
                      💡 提示：AI 分类时将从这些预设标签中选择最合适的分类，不会创建新的分类标签
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <Separator />

          {/* 提示词设置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">提示词设置</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetPrompts}
                className="h-8"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                恢复默认提示词
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="query-prompt" className="text-sm font-medium">
                查询提示词
              </Label>
              <Textarea
                id="query-prompt"
                value={localSettings.queryPrompt}
                onChange={(e) => handleSettingChange('queryPrompt', e.target.value)}
                placeholder="输入查询提示词"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category-prompt" className="text-sm font-medium">
                分类提示词
              </Label>
              <Textarea
                id="category-prompt"
                value={localSettings.categoryPrompt}
                onChange={(e) => handleSettingChange('categoryPrompt', e.target.value)}
                placeholder="输入分类提示词，使用 {categories} 作为分类列表占位符"
                className="min-h-[100px]"
              />
            </div>
          </div>

          <Separator />

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
            >
              <Save className="h-4 w-4 mr-2" />
              保存设置
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 border-accent/50 text-accent hover:bg-accent hover:text-accent-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              重置为默认
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// src/lib/types.ts

/**
 * @file 该文件用于存放项目中共享的TypeScript类型定义。
 * 将类型定义集中管理，可以提高代码的可维护性和复用性。
 */

/**
 * 查询结果的接口定义
 * @property timestamp - 查询发生时的时间戳，使用ISO格式字符串
 * @property query - 用户输入的查询词汇
 * @property result - AI模型返回的解释内容
 * @property category - 查询结果的分类（可选）
 */
export interface QueryResult {
  timestamp: string;
  query: string;
  result: string;
  category?: string;
}

/**
 * API及相关设置的接口定义
 * @property queryApiUrl - 查询功能的API端点URL
 * @property queryApiKey - 查询功能的API密钥
 * @property queryModel - 用于查询的AI模型
 * @property categoryApiUrl - 分类功能的API端点URL
 * @property categoryApiKey - 分类功能的API密钥
 * @property categoryModel - 用于分类的AI模型
 * @property categoryEnabled - 是否启用自动分类功能
 * @property predefinedCategories - 预设的分类标签列表
 * @property queryPrompt - 查询功能的系统提示词
 * @property categoryPrompt - 分类功能的系统提示词
 */
export interface APISettings {
  queryApiUrl: string;
  queryApiKey: string;
  queryModel: string;
  categoryApiUrl: string;
  categoryApiKey: string;
  categoryModel: string;
  categoryEnabled: boolean;
  predefinedCategories: string[];
  queryPrompt: string;
  categoryPrompt: string;
}
#!/usr/bin/env npx ts-node

/**
 * 英语学习内容管理脚本
 * AI 可以通过这个脚本来添加、更新学习内容
 * 
 * 用法:
 *   npx ts-node scripts/manage-content.ts add-word --word "ubiquitous" --meaning "无处不在的"
 *   npx ts-node scripts/manage-content.ts add-grammar --title "虚拟语气" --explanation "..."
 *   npx ts-node scripts/manage-content.ts list-words
 *   npx ts-node scripts/manage-content.ts list-grammar
 */

import * as fs from 'fs';
import * as path from 'path';

// 数据文件路径
const DATA_DIR = path.join(__dirname, '..', 'data');
const WORDS_FILE = path.join(DATA_DIR, 'words.json');
const GRAMMAR_FILE = path.join(DATA_DIR, 'grammar.json');

// 确保数据目录存在
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 生成 UUID
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 读取单词数据
function readWords(): { words: any[] } {
  ensureDataDir();
  if (!fs.existsSync(WORDS_FILE)) {
    return { words: [] };
  }
  return JSON.parse(fs.readFileSync(WORDS_FILE, 'utf-8'));
}

// 保存单词数据
function saveWords(data: { words: any[] }) {
  ensureDataDir();
  fs.writeFileSync(WORDS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// 读取语法数据
function readGrammar(): { grammar: any[] } {
  ensureDataDir();
  if (!fs.existsSync(GRAMMAR_FILE)) {
    return { grammar: [] };
  }
  return JSON.parse(fs.readFileSync(GRAMMAR_FILE, 'utf-8'));
}

// 保存语法数据
function saveGrammar(data: { grammar: any[] }) {
  ensureDataDir();
  fs.writeFileSync(GRAMMAR_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// 解析命令行参数
function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        result[key] = value;
        i++;
      } else {
        result[key] = 'true';
      }
    }
  }
  return result;
}

// 添加单词
function addWord(args: Record<string, string>) {
  const { word, meaning, phonetic, examples, tags, difficulty, notes } = args;

  if (!word || !meaning) {
    console.error('错误: 必须提供 --word 和 --meaning 参数');
    process.exit(1);
  }

  const data = readWords();

  // 检查是否已存在
  const existing = data.words.find((w) => w.word.toLowerCase() === word.toLowerCase());
  if (existing) {
    console.log(`单词 "${word}" 已存在，更新内容...`);
    Object.assign(existing, {
      meaning,
      phonetic: phonetic || existing.phonetic,
      example_sentences: examples ? examples.split('|') : existing.example_sentences,
      tags: tags ? tags.split(',') : existing.tags,
      difficulty: difficulty ? parseInt(difficulty) : existing.difficulty,
      notes: notes || existing.notes,
      updated_at: new Date().toISOString(),
    });
  } else {
    const newWord = {
      id: generateId(),
      word,
      phonetic: phonetic || '',
      meaning,
      example_sentences: examples ? examples.split('|') : [],
      tags: tags ? tags.split(',') : [],
      difficulty: difficulty ? parseInt(difficulty) : 1,
      notes: notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.words.push(newWord);
    console.log(`已添加单词: ${word}`);
  }

  saveWords(data);
  console.log('数据已保存到:', WORDS_FILE);
}

// 添加语法
function addGrammar(args: Record<string, string>) {
  const { title, explanation, examples, tags, difficulty, notes } = args;

  if (!title || !explanation) {
    console.error('错误: 必须提供 --title 和 --explanation 参数');
    process.exit(1);
  }

  const data = readGrammar();

  // 检查是否已存在
  const existing = data.grammar.find((g) => g.title === title);
  if (existing) {
    console.log(`语法点 "${title}" 已存在，更新内容...`);
    Object.assign(existing, {
      explanation,
      examples: examples ? examples.split('|') : existing.examples,
      tags: tags ? tags.split(',') : existing.tags,
      difficulty: difficulty ? parseInt(difficulty) : existing.difficulty,
      notes: notes || existing.notes,
      updated_at: new Date().toISOString(),
    });
  } else {
    const newGrammar = {
      id: generateId(),
      title,
      explanation,
      examples: examples ? examples.split('|') : [],
      tags: tags ? tags.split(',') : [],
      difficulty: difficulty ? parseInt(difficulty) : 1,
      notes: notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.grammar.push(newGrammar);
    console.log(`已添加语法点: ${title}`);
  }

  saveGrammar(data);
  console.log('数据已保存到:', GRAMMAR_FILE);
}

// 列出所有单词
function listWords() {
  const data = readWords();
  console.log('\n=== 单词列表 ===\n');
  if (data.words.length === 0) {
    console.log('暂无单词');
    return;
  }
  data.words.forEach((word, index) => {
    console.log(`${index + 1}. ${word.word} ${word.phonetic || ''}`);
    console.log(`   释义: ${word.meaning}`);
    if (word.tags.length > 0) {
      console.log(`   标签: ${word.tags.join(', ')}`);
    }
    console.log('');
  });
  console.log(`共 ${data.words.length} 个单词`);
}

// 列出所有语法
function listGrammar() {
  const data = readGrammar();
  console.log('\n=== 语法列表 ===\n');
  if (data.grammar.length === 0) {
    console.log('暂无语法点');
    return;
  }
  data.grammar.forEach((grammar, index) => {
    console.log(`${index + 1}. ${grammar.title}`);
    console.log(`   难度: ${'★'.repeat(grammar.difficulty)}${'☆'.repeat(5 - grammar.difficulty)}`);
    if (grammar.tags.length > 0) {
      console.log(`   标签: ${grammar.tags.join(', ')}`);
    }
    console.log('');
  });
  console.log(`共 ${data.grammar.length} 个语法点`);
}

// 删除单词
function deleteWord(args: Record<string, string>) {
  const { word, id } = args;

  if (!word && !id) {
    console.error('错误: 必须提供 --word 或 --id 参数');
    process.exit(1);
  }

  const data = readWords();
  const initialLength = data.words.length;

  data.words = data.words.filter((w) => {
    if (id) return w.id !== id;
    return w.word.toLowerCase() !== word.toLowerCase();
  });

  if (data.words.length === initialLength) {
    console.log('未找到要删除的单词');
    return;
  }

  saveWords(data);
  console.log('单词已删除');
}

// 删除语法
function deleteGrammar(args: Record<string, string>) {
  const { title, id } = args;

  if (!title && !id) {
    console.error('错误: 必须提供 --title 或 --id 参数');
    process.exit(1);
  }

  const data = readGrammar();
  const initialLength = data.grammar.length;

  data.grammar = data.grammar.filter((g) => {
    if (id) return g.id !== id;
    return g.title !== title;
  });

  if (data.grammar.length === initialLength) {
    console.log('未找到要删除的语法点');
    return;
  }

  saveGrammar(data);
  console.log('语法点已删除');
}

// 搜索单词
function searchWords(args: Record<string, string>) {
  const { query } = args;

  if (!query) {
    console.error('错误: 必须提供 --query 参数');
    process.exit(1);
  }

  const data = readWords();
  const results = data.words.filter((w) =>
    w.word.toLowerCase().includes(query.toLowerCase()) ||
    w.meaning.toLowerCase().includes(query.toLowerCase())
  );

  console.log(`\n=== 搜索结果: "${query}" ===\n`);
  if (results.length === 0) {
    console.log('未找到匹配的单词');
    return;
  }

  results.forEach((word, index) => {
    console.log(`${index + 1}. ${word.word} ${word.phonetic || ''}`);
    console.log(`   释义: ${word.meaning}`);
    console.log('');
  });
  console.log(`找到 ${results.length} 个匹配`);
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const params = parseArgs(args.slice(1));

  switch (command) {
    case 'add-word':
      addWord(params);
      break;
    case 'add-grammar':
      addGrammar(params);
      break;
    case 'list-words':
      listWords();
      break;
    case 'list-grammar':
      listGrammar();
      break;
    case 'delete-word':
      deleteWord(params);
      break;
    case 'delete-grammar':
      deleteGrammar(params);
      break;
    case 'search':
      searchWords(params);
      break;
    case 'help':
    default:
      console.log(`
英语学习内容管理脚本

用法:
  npx ts-node scripts/manage-content.ts <命令> [选项]

命令:
  add-word      添加单词
    --word      单词 (必填)
    --meaning   释义 (必填)
    --phonetic  音标
    --examples  例句 (多个用 | 分隔)
    --tags      标签 (多个用 , 分隔)
    --difficulty 难度 (1-5)
    --notes     笔记

  add-grammar   添加语法点
    --title       标题 (必填)
    --explanation 解释 (必填)
    --examples    示例 (多个用 | 分隔)
    --tags        标签 (多个用 , 分隔)
    --difficulty  难度 (1-5)
    --notes       笔记

  list-words    列出所有单词
  list-grammar  列出所有语法点
  
  delete-word   删除单词
    --word      单词
    --id        单词ID

  delete-grammar 删除语法点
    --title     标题
    --id        语法ID

  search        搜索单词
    --query     搜索词

  help          显示帮助

示例:
  npx ts-node scripts/manage-content.ts add-word --word "ubiquitous" --meaning "无处不在的" --phonetic "/juːˈbɪkwɪtəs/" --difficulty 4
  npx ts-node scripts/manage-content.ts add-grammar --title "虚拟语气" --explanation "表示假设..." --difficulty 3
  npx ts-node scripts/manage-content.ts search --query "un"
      `);
  }
}

main();

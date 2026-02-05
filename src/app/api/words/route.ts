import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Word } from '@/types';

const dataFilePath = path.join(process.cwd(), 'data', 'words.json');

function readData() {
  if (!fs.existsSync(dataFilePath)) {
    return { words: [] };
  }
  const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
  try {
    return JSON.parse(fileContent);
  } catch (e) {
    return { words: [] };
  }
}

function writeData(data: { words: Word[] }) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  const data = readData();
  return NextResponse.json(data.words);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = readData();

    // Ensure the new word has required fields
    const newWord: Word = {
      ...body,
      id: body.id || crypto.randomUUID(),
      created_at: body.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'local', // Default for local storage
    };

    data.words.unshift(newWord); // Add to beginning
    writeData(data);

    return NextResponse.json(newWord);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save word' }, { status: 500 });
  }
}

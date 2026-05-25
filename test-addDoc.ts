import { addDoc, collection } from './src/lib/supabase-adapter.ts';

async function add() {
  try {
    const res = await addDoc({ collectionPath: 'gallery' } as any, {
      title: "Test Adapter",
      category: "KEGIATAN",
      imageUrl: "https://example.com/test2.jpg",
      description: "testing",
      createdAt: Date.now()
    });
    console.log("Success", res);
  } catch (e) {
    console.log("Error", e);
  }
}
add();

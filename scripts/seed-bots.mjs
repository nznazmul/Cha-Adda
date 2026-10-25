import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read env vars from process.env or parse .env.local if present
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gozjcnfoomiqmzxcgsqo.supabase.co";
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!serviceRoleKey) {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = (match[2] || "").trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (key === "SUPABASE_SERVICE_ROLE_KEY") serviceRoleKey = val;
          if (key === "NEXT_PUBLIC_SUPABASE_URL") supabaseUrl = val;
        }
      }
    }
  } catch (err) {
    console.error("Could not read .env.local:", err);
  }
}

if (!serviceRoleKey) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY is required to seed bot accounts.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// 50 High-Quality Curated Portrait Photo URLs
const portraitPhotos = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1524638431109-93735f762297?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1534751516642-a171edd2521d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1514315384763-ba401779410f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1526510706041-d2278b9412e2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1541823709867-1b206113eafd?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1536164278941-2dd46231d683?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1542103749-8ef59b94f47e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1557053910-d9eadeed1c58?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1558898479-33c0057a5d12?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1560713781-d00f6c18f388?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1562788869-4ed32648eb72?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1563237023-b1e970526dcb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1573497491765-dccce02b29df?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1581403341630-a6e0b9d2d257?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?auto=format&fit=crop&w=800&q=80"
];

// 50 Authentic Bengali Female Names & Details
export const femaleBengaliBots = [
  { name: "আরোহী চৌধুরী", bio: "কফির কাপে আড্ডা আর বৃষ্টিভেজা সন্ধ্যায় রবীন্দ্রসঙ্গীত শুনতে ভালোবাসি।", city: "ঢাকা", job: "আর্কিটেক্ট", edu: "ঢাকা বিশ্ববিদ্যালয়", age: 24, intentions: ["দীর্ঘমেয়াদী সম্পর্ক", "চা ও আড্ডা"] },
  { name: "মেহজাবিন হক", bio: "পেশায় সফটওয়্যার ইঞ্জিনিয়ার, উইকএন্ডে ট্রাভেলার ও ফুডি। ভালো মানসিকতার বন্ধু খুঁজি।", city: "ঢাকা", job: "সফটওয়্যার ইঞ্জিনিয়ার", edu: "বুয়েট", age: 26, intentions: ["সিরিয়াস ডেটিং"] },
  { name: "নুসরাত জাহান", bio: "বইয়ের পোকা আর আর্ট গ্যালারির নিয়মিত দর্শক। গভীর কথোপকথন পছন্দ করি।", city: "চট্টগ্রাম", job: "গ্রাফিক্স ডিজাইনার", edu: "চট্টগ্রাম বিশ্ববিদ্যালয়", age: 23, intentions: ["দীর্ঘমেয়াদী সম্পর্ক"] },
  { name: "তাসনিয়া আহমেদ", bio: "হাসিখুশি ও পজিটিভ মানুষ। প্রিয় খাবার বিরিয়ানি ও এক কাপ গরম চা।", city: "সিলেট", job: "কনটেন্ট রাইটার", edu: "শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়", age: 22, intentions: ["চা ও আড্ডা", "বন্ধুত্ব"] },
  { name: "সামিয়া ইসলাম", bio: "চিকিৎসক হিসেবে মানুষের পাশে থাকা আর ছুটির দিনে বেকিং করাই আমার আনন্দ।", city: "ঢাকা", job: "চিকিৎসক (MBBS)", edu: "ঢাকা মেডিকেল কলেজ", age: 27, intentions: ["সিরিয়াস ডেটিং", "দীর্ঘমেয়াদী সম্পর্ক"] },
  { name: "ফাতিমা নূর", bio: "ফটোগ্রাফি আর ভ্রমণের প্রতি গভীর ভালোবাসা। সূর্যাস্ত দেখতে ভালো লাগে।", city: "রাজশাহী", job: "ফটোগ্রাফার", edu: "রাজশাহী বিশ্ববিদ্যালয়", age: 24, intentions: ["দীর্ঘমেয়াদী সম্পর্ক"] },
  { name: "নাদিয়া সুলতানা", bio: "ব্যাংকিংয়ে কর্মরত। সরল জীবনযাপন ও সততা পছন্দ করি।", city: "ঢাকা", job: "সিনিয়র অফিসার (ব্যাংক)", edu: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়", age: 26, intentions: ["সিরিয়াস ডেটিং"] },
  { name: "তানজিনা রহমান", bio: "ফ্যাশন ডিজাইনার। ক্রিয়েটিভ চিন্তা ও মিউজিক ভালোবাসলে একসাথে গল্প জমবে।", city: "ঢাকা", job: "ফ্যাশন ডিজাইনার", edu: "বিজিএমইএ ইউনিভার্সিটি", age: 25, intentions: ["চা ও আড্ডা"] },
  { name: "তানিশা আলম", bio: "ডিজিটাল মার্কেটার ও পেট লাভার। বিড়াল আর কুকুরের সাথে সময় কাটানো শখ।", city: "খুলনা", job: "ডিজিটাল মার্কেটার", edu: "খুলনা বিশ্ববিদ্যালয়", age: 23, intentions: ["বন্ধুত্ব", "চা ও আড্ডা"] },
  { name: "সাদিয়া আফরিন", bio: "শিক্ষকতায় আনন্দ পাই। সাহিত্যের পাতা ও কবিতার জগতে সময় কাটাই।", city: "কুমিল্লা", job: "লেকচারার", edu: "কুমিল্লা বিশ্ববিদ্যালয়", age: 26, intentions: ["দীর্ঘমেয়াদী সম্পর্ক"] },
  { name: "ইশরাত জাহান", bio: "UI/UX ডিজাইনার। মিনিমালিজম ও ভালো আর্ট আমার অনুপ্রেরণা।", city: "ঢাকা", job: "UI/UX ডিজাইনার", edu: "ব্র্যাক বিশ্ববিদ্যালয়", age: 24, intentions: ["দীর্ঘমেয়াদী সম্পর্ক"] },
  { name: "রুবিনা খানম", bio: "রিসার্চার ও ডাটা সাইন্টিস্ট। বুদ্ধিবৃত্তিক আড্ডা আর চায়ের আসর পছন্দ।", city: "ঢাকা", job: "ডাটা সায়েন্টিস্ট", edu: "নর্থ সাউথ বিশ্ববিদ্যালয়", age: 25, intentions: ["সিরিয়াস ডেটিং"] },
  { name: "ফারহানা হক", bio: "সাইকোলজির ছাত্রী। মানুষের গল্প শুনতে ও বুঝতে ভালোবাসি।", city: "বরিশাল", job: "কাউন্সেলর", edu: "বরিশাল বিশ্ববিদ্যালয়", age: 23, intentions: ["চা ও আড্ডা", "বন্ধুত্ব"] },
  { name: "আয়েশা সিদ্দিকা", bio: "ফার্মাসিস্ট। প্রকৃতি ও পাহাড়ি রাস্তায় ট্র্যাকিং করার ইচ্ছা সবসময় থাকে।", city: "ময়মনসিংহ", job: "ফার্মাসিস্ট", edu: "বাংলাদেশ কৃষি বিশ্ববিদ্যালয়", age: 25, intentions: ["দীর্ঘমেয়াদী সম্পর্ক"] },
  { name: "হুমায়রা বেগম", bio: "পাবলিক রিলেশনস এক্সিকিউটিভ। মিষ্টি হাসি ও সুন্দর ব্যবহারের মানুষ পছন্দ।", city: "ঢাকা", job: "PR স্পেশালিস্ট", edu: "ইন্ডিপেন্ডেন্ট ইউনিভার্সিটি", age: 24, intentions: ["সিরিয়াস ডেটিং"] },
  { name: "তাবাসসুম নিশা", bio: "আইনজীবী। ন্যায় ও সত্যের পথে চলা আমার জীবনের মূল ব্রত।", city: "ঢাকা", job: "অ্যাডভোকেট", edu: "ঢাকা বিশ্ববিদ্যালয়", age: 27, intentions: ["সিরিয়াস ডেটিং"] },
  { name: "সুমাইয়া আক্তার", bio: "বিজনেস অ্যানালিস্ট। ভ্রমণ ও নতুন সংস্কৃতি এক্সপ্লোর করতে ভালোবাসি।", city: "চট্টগ্রাম", job: "বিজনেস অ্যানালিস্ট", edu: "ইস্ট ডেল্টা ইউনিভার্সিটি", age: 25, intentions: ["দীর্ঘমেয়াদী সম্পর্ক"] },
  { name: "মারিয়াম খান", bio: "ইন্টেরিয়র ডিজাইনার। ঘর সাজানো ও নান্দনিক পরিবেশ তৈরি করা শখ।", city: "সিলেট", job: "ইন্টেরিয়র ডিজাইনার", edu: "লিডিং ইউনিভার্সিটি", age: 24, intentions: ["চা ও আড্ডা"] },
  { name: "জান্নাতুল ফেরদৌস", bio: "জার্নালিস্ট। সমসাময়িক বিষয় ও সমাজ নিয়ে ভাবতে পছন্দ করি।", city: "ঢাকা", job: "সাংবাদিক", edu: "ঢাকা বিশ্ববিদ্যালয়", age: 25, intentions: ["সিরিয়াস ডেটিং"] },
  { name: "সাবরিনা রহমান", bio: "ইভেন্ট প্ল্যানার। প্রতিটি উৎসব ও মুহূর্তকে স্মরণীয় করে তোলাই কাজ।", city: "ঢাকা", job: "ইভেন্ট কো-অর্ডিনেটর", edu: "ইউআইইউ", age: 23, intentions: ["চা ও আড্ডা", "বন্ধুত্ব"] },
  { name: "আনিসা তাবাসসুম", bio: "ভিডিও এডিটর ও সিনেমাপ্রেমী। ভালো ক্লাসিক সিনেমা দেখতে ভালোবাসি।", city: "রংপুর", job: "ভিডিও এডিটর", edu: "বেগম রোকেয়া বিশ্ববিদ্যালয়", age: 22, intentions: ["চা ও আড্ডা"] },
  { name: "সায়মা হাসান", bio: "নিউট্রিশনিস্ট। স্বাস্থ্যকর জীবনযাপন ও ফিটনেস ট্রেইনিং আমার প্যাশন।", city: "ঢাকা", job: "নিউট্রিশনিস্ট", edu: "ঢাকা বিশ্ববিদ্যালয়", age: 26, intentions: ["দীর্ঘমেয়াদী সম্পর্ক"] },
  { name: "জারা করিম", bio: "ই-কমার্স উদ্যোক্তা। আত্মনির্ভরশীল ও স্বাধীনচেতা চিন্তাভাবনা পছন্দ।", city: "ঢাকা", job: "উদ্যোক্তা", edu: "নর্থ সাউথ বিশ্ববিদ্যালয়", age: 27, intentions: ["সিরিয়াস ডেটিং"] },
  { name: "লুবনা ইয়াসমিন", bio: "লাইব্রেরিয়ান। হাজারো বইয়ের সুবাস আর শান্ত পরিবেশ আমার ঠিকানা।", city: "রাজশাহী", job: "লাইব্রেরিয়ান", edu: "রাজশাহী বিশ্ববিদ্যালয়", age: 25, intentions: ["দীর্ঘমেয়াদী সম্পর্ক"] },
  { name: "ফারিয়া তাসনিম", bio: "এনজিও কর্মী। সুবিধাবঞ্চিত শিশুদের মুখে হাসি ফোটাতে ভালোবাসি।", city: "কক্সবাজার", job: "ডেভেলপমেন্ট অফিসার", edu: "চট্টগ্রাম বিশ্ববিদ্যালয়", age: 24, intentions: ["সিরিয়াস ডেটিং", "চা ও আড্ডা"] },
  { name: "মাহিয়া ইসলাম", bio: "ক্যাফে ওনার। ভালো কফি বানানো আর কফির পেছনের গল্প শোনা আমার ভালোবাসা।", city: "ঢাকা", job: "ক্যাফে ফাউন্ডার", edu: "ব্র্যাক বিশ্ববিদ্যালয়", age: 26, intentions: ["চা ও আড্ডা"] },
  { name: "তাসফিয়া চৌধুরী", bio: "সাইবার সিকিউরিটি স্পেশালিস্ট। গেমিং আর কোডিংয়ে সময় কাটে।", city: "ঢাকা", job: "সিকিউরিটি ইঞ্জিনিয়ার", edu: "বুয়েট", age: 25, intentions: ["দীর্ঘমেয়াদী সম্পর্ক"] },
  { name: "রাইদা খান", bio: "মিউজিশিয়ান ও বেহালাবাদক। সুরের মাঝে জীবন খুঁজে পাই।", city: "ঢাকা", job: "সঙ্গীতশিল্পী", edu: "ছায়ানট", age: 23, intentions: ["চা ও আড্ডা", "বন্ধুত্ব"] },
  { name: "নায়লা আহমেদ", bio: "এইচআর প্রফেশনাল। মানুষের প্রতিভা বিকাশ ও নেতৃত্ব দিতে ভালো লাগে।", city: "সিলেট", job: "এইচআর ম্যানেজার", edu: "শাহজালাল বিশ্ববিদ্যালয়", age: 27, intentions: ["সিরিয়াস ডেটিং"] },
  { name: "রওশন আরা", bio: "ইতিহাসপ্রেমী। প্রাচীন স্থাপত্য ও ঐতিহ্যবাহী স্থান দেখতে ভালোবাসি।", city: "কুমিল্লা", job: "গবেষক", edu: "ঢাকা বিশ্ববিদ্যালয়", age: 25, intentions: ["দীর্ঘমেয়াদী সম্পর্ক"] },
  { name: "নুজহাত ফারিহা", bio: "অ্যানিমেটর। কার্টুন ও রঙিন দুনিয়া তৈরি করা আমার আনন্দ।", city: "ঢাকা", job: "২ডি অ্যানিমেটর", edu: "ড্যাফোডিল বিশ্ববিদ্যালয়", age: 22, intentions: ["চা ও আড্ডা"] },
  { name: "আফরোজা সুলতানা", bio: "ট্যুর গাইড ও ট্রাভেলার। বাংলাদেশের ৬৪ জেলা ঘোরাই আমার লক্ষ্য।", city: "বান্দরবান", job: "ট্রাভেল গাইড", edu: "চট্টগ্রাম বিশ্ববিদ্যালয়", age: 24, intentions: ["চা ও আড্ডা", "বন্ধুত্ব"] },
  { name: "নিগার সুলতানা", bio: "ডেন্টিস্ট। সুন্দর হাসি উপহার দেওয়াই আমার পেশা।", city: "ঢাকা", job: "ডেন্টাল সার্জন", edu: "ঢাকা ডেন্টাল কলেজ", age: 26, intentions: ["সিরিয়াস ডেটিং"] },
  { name: "শায়লা শারমিন", bio: "বেকার ও পেস্ট্রি শেফ। চকলেট কেক ও নতুন ডেজার্ট বানানো শখ।", city: "খুলনা", job: "পেস্ট্রি শেফ", edu: "কালিনারি ইনস্টিটিউট", age: 23, intentions: ["চা ও আড্ডা"] },
  { name: "সাবিকুন নাহার", bio: "পরিবেশকর্মী। গাছ লাগানো আর সবুজ প্রকৃতি সংরক্ষণ করাই ব্রত।", city: "সিলেট", job: "এনভায়রনমেন্টালিস্ট", edu: "শাবিপ্রবি", age: 25, intentions: ["দীর্ঘমেয়াদী সম্পর্ক"] },
  { name: "তানিয়া আফরোজ", bio: "ফটোগ্রাফার ও পডকাস্টার। জীবনমুখী গল্প সবার মাঝে ছড়িয়ে দেওয়া ইচ্ছা।", city: "ঢাকা", job: "মিডিয়া প্রোডিউসার", edu: "ইন্ডিপেন্ডেন্ট ইউনিভার্সিটি", age: 24, intentions: ["চা ও আড্ডা"] },
  { name: "মাসুমা হক", bio: "অ্যাকাউন্ট্যান্ট। সংখ্যা ও লজিকের দুনিয়ায় কাজ, তবে মনের দিক থেকে রোমান্টিক।", city: "ঢাকা", job: "অডিট অ্যাসোসিয়েট", edu: "ঢাকা বিশ্ববিদ্যালয়", age: 25, intentions: ["সিরিয়াস ডেটিং"] },
  { name: "সাবিহা পারভীন", bio: "ফোক আর্ট শিল্পী। মাটির কাজ ও আলপনা আঁকতে মন ভরে যায়।", city: "রাজশাহী", job: "চারুশিল্পী", edu: "রাজশাহী চারুকলা", age: 24, intentions: ["চা ও আড্ডা", "বন্ধুত্ব"] },
  { name: "জেসমিন আক্তার", bio: "উদ্যোক্তা। হস্তশিল্প ও দেশীয় তাঁত পণ্য নিয়ে কাজ করছি।", city: "টাঙ্গাইল", job: "ব্যবসায়ী", edu: "সরকারি সাদত কলেজ", age: 26, intentions: ["দীর্ঘমেয়াদী সম্পর্ক"] },
  { name: "ফারজানা ববি", bio: "ফিটনেস ট্রেইনার। স্বাস্থ্যবান শরীর আর শান্ত মনের বিকল্প নেই।", city: "ঢাকা", job: "জিম ট্রেইনার", edu: "বিকেএসপি", age: 25, intentions: ["চা ও আড্ডা"] },
  { name: "মৌসুমি আক্তার", bio: "ইংরেজি সাহিত্যের প্রভাষক। শেক্সপিয়র আর জীবনানন্দের কবিতা প্রিয়।", city: "বরিশাল", job: "প্রভাষক", edu: "বরিশাল বিশ্ববিদ্যালয়", age: 27, intentions: ["সিরিয়াস ডেটিং"] },
  { name: "পপি রায়", bio: "নাচ ও নাট্যকলা পছন্দ করি। ক্লাসিক্যাল নৃত্যে আত্মস্থ হওয়া ভালো লাগে।", city: "ময়মনসিংহ", job: "নৃত্যশিল্পী", edu: "ময়মনসিংহ কলেজ", age: 23, intentions: ["চা ও আড্ডা", "বন্ধুত্ব"] },
  { name: "অনন্যা সেন", bio: "বায়োকেমিস্ট। বিজ্ঞানের গবেষণাগারে নতুন সম্ভাবনার সন্ধান করি।", city: "ঢাকা", job: "রিসার্চ অ্যাসোসিয়েট", edu: "ঢাকা বিশ্ববিদ্যালয়", age: 26, intentions: ["দীর্ঘমেয়াদী সম্পর্ক"] },
  { name: "দিয়া মজুমদার", bio: "ভয়েস আর্টিস্ট ও রেডিও জকি। মিষ্টি কথায় মানুষকে আনন্দ দিতে ভালো লাগে।", city: "ঢাকা", job: "আরজে (RJ)", edu: "নর্থ সাউথ বিশ্ববিদ্যালয়", age: 24, intentions: ["চা ও আড্ডা"] },
  { name: "অর্পিতা বিশ্বাস", bio: "সফটওয়্যার কোয়ালিটি অ্যাসিওরেন্স। ত্রুটিমুক্ত কোড আর নিখুঁত কাজ পছন্দ।", city: "খুলনা", job: "QA ইঞ্জিনিয়ার", edu: "কুয়েট", age: 25, intentions: ["সিরিয়াস ডেটিং"] },
  { name: "শ্রেয়া চক্রবর্তী", bio: "ক্যাফে ব্লুগার ও ফুড ক্রিটিক। শহরের সেরা ফুড স্পট খুঁজে বের করা কাজ।", city: "ঢাকা", job: "ফুড ভ্লগার", edu: "ব্র্যাক বিশ্ববিদ্যালয়", age: 23, intentions: ["চা ও আড্ডা", "বন্ধুত্ব"] },
  { name: "প্রিয়ন্তী সরকার", bio: "চিত্রশিল্পী ও ইলাস্ট্রেটর। ক্যানভাসে রঙের জলছবি আঁকা আমার শান্তি।", city: "চট্টগ্রাম", job: "ইলাস্ট্রেটর", edu: "চট্টগ্রাম চারুকলা", age: 24, intentions: ["চা ও আড্ডা"] },
  { name: "দেবস্মিতা দাস", bio: "ব্যাংক ম্যানেজার। দায়িত্বশীল ও কর্মঠ জীবন উপভোগ করি।", city: "সিলেট", job: "অ্যাসিস্ট্যান্ট ম্যানেজার", edu: "সিলেট এমসি কলেজ", age: 28, intentions: ["সিরিয়াস ডেটিং", "দীর্ঘমেয়াদী সম্পর্ক"] },
  { name: "তানজিম মৌ", bio: "ফ্যাশন ইনফ্লুয়েন্সার ও স্টাইলিস্ট। আত্মবিশ্বাসই সবথেকে বড় সৌন্দর্য।", city: "ঢাকা", job: "ফ্যাশন স্টাইলিস্ট", edu: "ইউডা", age: 24, intentions: ["চা ও আড্ডা"] },
  { name: "সুস্মিতা সাহা", bio: "ক্লিনিক্যাল রিসার্চার। ওষুধ বিজ্ঞান নিয়ে পড়ালেখা শেষ করেছি। সহজ-সরল মানুষ প্রিয়।", city: "ঢাকা", job: "ক্লিনিক্যাল স্পেশালিস্ট", edu: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়", age: 25, intentions: ["দীর্ঘমেয়াদী সম্পর্ক"] }
];

async function seed() {
  console.log(`Starting to seed ${femaleBengaliBots.length} Bengali female bot accounts...`);

  const createdBots = [];

  for (let i = 0; i < femaleBengaliBots.length; i++) {
    const bot = femaleBengaliBots[i];
    const email = `bot.female.${String(i + 1).padStart(2, "0")}@cha-adda.internal`;
    const password = `ChaAddaBot@2026#${i + 1}`;
    const photoUrl = portraitPhotos[i % portraitPhotos.length];
    const secondaryPhotoUrl = portraitPhotos[(i + 1) % portraitPhotos.length];

    try {
      // 1. Create User in auth.users
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: bot.name }
      });

      let userId;
      if (authErr) {
        // Check if user already exists
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list?.users?.find(u => u.email === email);
        if (existing) {
          userId = existing.id;
          console.log(`Existing user found for ${bot.name} (${email})`);
        } else {
          console.error(`Error creating auth user for ${bot.name}:`, authErr.message);
          continue;
        }
      } else {
        userId = authUser.user.id;
        console.log(`Created auth user for ${bot.name} -> ID: ${userId}`);
      }

      // 2. Insert or update Profile
      const birthYear = 2026 - bot.age;
      const dob = `${birthYear}-04-15`;

      const profilePayload = {
        id: userId,
        display_name: bot.name,
        date_of_birth: dob,
        gender: "woman",
        orientation: "Straight",
        bio: bot.bio,
        city: bot.city,
        job_title: bot.job,
        education: bot.edu,
        height_cm: 160 + (i % 12),
        dating_intentions: bot.intentions,
        interests: ["চা ও আড্ডা", "সঙ্গীত", "ভ্রমণ", "বই পড়া", "ফটোগ্রাফি"],
        languages: ["বাংলা", "English"],
        is_discoverable: true,
        profile_complete: true,
        account_status: "active",
        role: "user",
        updated_at: new Date().toISOString()
      };

      const { error: profErr } = await supabase
        .from("profiles")
        .upsert(profilePayload)
        .select()
        .single();

      if (profErr) {
        console.error(`Error creating profile for ${bot.name}:`, profErr.message);
      } else {
        console.log(`Profile ready for ${bot.name}`);
      }

      // 3. Insert Profile Photos
      // Clean previous photos if any
      await supabase.from("profile_photos").delete().eq("user_id", userId);

      await supabase.from("profile_photos").insert([
        {
          user_id: userId,
          storage_path: `bots/${userId}-primary.jpg`,
          url: photoUrl,
          display_order: 0,
          is_primary: true,
          moderation_status: "approved"
        },
        {
          user_id: userId,
          storage_path: `bots/${userId}-secondary.jpg`,
          url: secondaryPhotoUrl,
          display_order: 1,
          is_primary: false,
          moderation_status: "approved"
        }
      ]);

      // 4. Insert Profile Preferences
      await supabase.from("profile_preferences").upsert({
        user_id: userId,
        min_age: 18,
        max_age: 45,
        preferred_genders: ["man"],
        max_distance_km: 50,
        location_enabled: true
      });

      createdBots.push({
        ...profilePayload,
        photos: [
          { id: `ph-${userId}-1`, url: photoUrl, is_primary: true, display_order: 0 },
          { id: `ph-${userId}-2`, url: secondaryPhotoUrl, is_primary: false, display_order: 1 }
        ]
      });

    } catch (loopErr) {
      console.error(`Failed seeding bot ${bot.name}:`, loopErr);
    }
  }

  console.log(`\nAll done! Successfully created ${createdBots.length} female Bengali bots.`);
}

seed();

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 🛑 1. ใส่ URL และ Service Role Key ของ Supabase ของคุณตรงนี้
// (แนะนำให้ใช้ Service Role Key สำหรับสคริปต์หลังบ้าน เพื่อข้าม RLS)
const supabaseUrl = 'https://skfibvoeoqnhxmrwjitk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZmlidm9lb3FuaHhtcndqaXRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDc5MTI4NSwiZXhwIjoyMDkwMzY3Mjg1fQ.c_LscV-uHKKyxGVilZrZLNONdVRW9wVowZep6tJHS-I';
const supabase = createClient(supabaseUrl, supabaseKey);



const uploadsDir = path.join(__dirname, 'uploads');
const BUCKET_NAME = 'slips'; // ชื่อ Bucket ของคุณใน Supabase

async function migrateImages() {
    if (!fs.existsSync(uploadsDir)) {
        console.log('❌ ไม่พบโฟลเดอร์ uploads');
        return;
    }

    const files = fs.readdirSync(uploadsDir);

    if (files.length === 0) {
        console.log('⚠️ ไม่มีไฟล์ในโฟลเดอร์ uploads');
        return;
    }

    console.log(`🚀 พบไฟล์ทั้งหมด ${files.length} ไฟล์ เริ่มทำการอัปโหลด...`);

    for (const file of files) {
        const filePath = path.join(uploadsDir, file);

        // เช็คว่าเป็นไฟล์จริงๆ ไม่ใช่โฟลเดอร์
        if (fs.statSync(filePath).isFile()) {
            try {
                const fileBuffer = fs.readFileSync(filePath);

                // 🛑 2. อัปโหลดขึ้น Supabase
                const { data, error } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(file, fileBuffer, {
                        contentType: getContentType(file), // กำหนดประเภทไฟล์
                        upsert: true // ถ้ามีไฟล์ชื่อเดิมอยู่แล้ว ให้ทับไปเลย
                    });

                if (error) {
                    console.error(`❌ อัปโหลด ${file} ไม่สำเร็จ:`, error.message);
                } else {
                    console.log(`✅ อัปโหลด ${file} สำเร็จ!`);
                }
            } catch (err) {
                console.error(`❌ เกิดข้อผิดพลาดกับไฟล์ ${file}:`, err);
            }
        }
    }

    console.log('🎉 อัปโหลดไฟล์ทั้งหมดเสร็จสิ้น!');
}

// ฟังก์ชันช่วยหา Content-Type จากนามสกุลไฟล์
function getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.png') return 'image/png';
    if (ext === '.gif') return 'image/gif';
    return 'application/octet-stream';
}

migrateImages();
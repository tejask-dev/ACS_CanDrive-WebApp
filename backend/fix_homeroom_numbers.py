#!/usr/bin/env python3
"""
Migration script to fix homeroom numbers from float to string format
This ensures room numbers like 18.0 become "018" and 118.0 becomes "118"
"""

from database import get_db
from models import Student, Teacher
import re

def fix_homeroom_numbers():
    """Fix homeroom numbers to be properly formatted strings"""
    try:
        db = next(get_db())
        
        # Fix student homeroom numbers
        students = db.query(Student).all()
        student_fixes = 0
        
        for student in students:
            if student.homeroom_number:
                # Convert to string and clean up
                original = student.homeroom_number
                fixed = str(original).strip()
                
                # Remove .0 suffix if present
                if fixed.endswith('.0'):
                    fixed = fixed[:-2]
                
                # Pad with leading zeros if it's a number (e.g., 18 -> 018)
                if fixed.isdigit():
                    # Only pad if it's 1-2 digits (don't pad 118 -> 0118)
                    if len(fixed) <= 2:
                        fixed = fixed.zfill(3)  # Pad to 3 digits: 18 -> 018
                
                if str(original) != fixed:
                    print(f"Student {student.first_name} {student.last_name}: '{original}' -> '{fixed}'")
                    student.homeroom_number = fixed
                    student_fixes += 1
        
        # Fix teacher homeroom numbers
        teachers = db.query(Teacher).all()
        teacher_fixes = 0
        
        for teacher in teachers:
            if teacher.homeroom_number:
                # Convert to string and clean up
                original = teacher.homeroom_number
                fixed = str(original).strip()
                
                # Remove .0 suffix if present
                if fixed.endswith('.0'):
                    fixed = fixed[:-2]
                
                # Pad with leading zeros if it's a number (e.g., 18 -> 018)
                if fixed.isdigit():
                    # Only pad if it's 1-2 digits (don't pad 118 -> 0118)
                    if len(fixed) <= 2:
                        fixed = fixed.zfill(3)  # Pad to 3 digits: 18 -> 018
                
                if str(original) != fixed:
                    print(f"Teacher {teacher.full_name or f'{teacher.first_name} {teacher.last_name}'}: '{original}' -> '{fixed}'")
                    teacher.homeroom_number = fixed
                    teacher_fixes += 1
        
        # Commit all changes
        db.commit()
        
        print(f"\nMigration completed!")
        print(f"Fixed {student_fixes} student homeroom numbers")
        print(f"Fixed {teacher_fixes} teacher homeroom numbers")
        print(f"Total fixes: {student_fixes + teacher_fixes}")
        
        return {
            "success": True,
            "student_fixes": student_fixes,
            "teacher_fixes": teacher_fixes,
            "total_fixes": student_fixes + teacher_fixes
        }
        
    except Exception as e:
        print(f"Migration failed: {e}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    print("Starting homeroom number migration...")
    result = fix_homeroom_numbers()
    print(f"Migration result: {result}")

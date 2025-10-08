#!/usr/bin/env python3
"""
Debug script to check grade totals and identify doubling issue
"""
from database import get_db
from models import Student
from collections import defaultdict

def debug_grade_totals():
    db = next(get_db())
    
    print("=== DEBUGGING GRADE TOTALS ===")
    
    # Get all students
    students = db.query(Student).filter(Student.event_id == 1).all()
    print(f"Total students: {len(students)}")
    
    # Calculate grade totals manually
    grade_totals = defaultdict(int)
    grade_students = defaultdict(list)
    
    for student in students:
        grade = str(student.grade or '').strip()
        if grade:
            grade_totals[grade] += student.total_cans or 0
            grade_students[grade].append({
                'name': f"{student.first_name} {student.last_name}",
                'cans': student.total_cans or 0
            })
    
    print("\n=== GRADE TOTALS ===")
    for grade in sorted(grade_totals.keys()):
        total = grade_totals[grade]
        student_count = len(grade_students[grade])
        print(f"Grade {grade}: {total} cans ({student_count} students)")
        
        # Show top 5 students in this grade
        top_students = sorted(grade_students[grade], key=lambda x: x['cans'], reverse=True)[:5]
        for student in top_students:
            print(f"  - {student['name']}: {student['cans']} cans")
    
    # Check for potential duplicates
    print("\n=== CHECKING FOR DUPLICATES ===")
    name_counts = defaultdict(int)
    for student in students:
        full_name = f"{student.first_name} {student.last_name}".strip()
        name_counts[full_name] += 1
    
    duplicates = {name: count for name, count in name_counts.items() if count > 1}
    if duplicates:
        print("DUPLICATE STUDENTS FOUND:")
        for name, count in duplicates.items():
            print(f"  - {name}: {count} times")
    else:
        print("No duplicate students found")
    
    # Check total cans across all students
    total_cans = sum(student.total_cans or 0 for student in students)
    print(f"\nTotal cans across all students: {total_cans}")
    
    db.close()

if __name__ == "__main__":
    debug_grade_totals()

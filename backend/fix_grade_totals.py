#!/usr/bin/env python3
"""
Fix grade totals by ensuring no double counting
"""
from database import get_db
from models import Student, Donation
from collections import defaultdict

def fix_grade_totals():
    db = next(get_db())
    
    print("=== FIXING GRADE TOTALS ===")
    
    # Get all students
    students = db.query(Student).filter(Student.event_id == 1).all()
    print(f"Total students: {len(students)}")
    
    # Reset all student totals to 0 first
    for student in students:
        student.total_cans = 0
    
    db.commit()
    print("Reset all student totals to 0")
    
    # Recalculate from donations only (this ensures no double counting)
    donations = db.query(Donation).filter(Donation.event_id == 1).all()
    print(f"Total donations: {len(donations)}")
    
    for donation in donations:
        if donation.student_id:
            student = db.query(Student).filter(Student.id == donation.student_id).first()
            if student:
                student.total_cans = (student.total_cans or 0) + (donation.amount or 0)
    
    db.commit()
    print("Recalculated totals from donations only")
    
    # Now check the grade totals
    grade_totals = defaultdict(int)
    for student in students:
        grade = str(student.grade or '').strip()
        if grade:
            grade_totals[grade] += student.total_cans or 0
    
    print("\n=== NEW GRADE TOTALS ===")
    for grade in sorted(grade_totals.keys()):
        total = grade_totals[grade]
        print(f"Grade {grade}: {total} cans")
    
    # Check total cans
    total_cans = sum(student.total_cans or 0 for student in students)
    print(f"\nTotal cans across all students: {total_cans}")
    
    db.close()
    print("Database fix complete!")

if __name__ == "__main__":
    fix_grade_totals()

from database import get_db
from models import Student, Donation

db = next(get_db())

# Check all students with donations
students_with_donations = db.query(Student).filter(Student.total_cans > 0).all()
print(f"Students with donations: {len(students_with_donations)}")
for s in students_with_donations:
    print(f"  - {s.first_name} {s.last_name}: {s.total_cans} cans")

# Check all donations
all_donations = db.query(Donation).all()
print(f"\nTotal donations in database: {len(all_donations)}")
for d in all_donations:
    print(f"  - Student ID {d.student_id}: {d.amount} cans")

# Check total cans across all students
total_cans = sum(s.total_cans or 0 for s in db.query(Student).all())
print(f"\nTotal cans across all students: {total_cans}")

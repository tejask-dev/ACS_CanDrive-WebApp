from database import get_db
from models import Event, Student

db = next(get_db())

# Check if event 1 exists
event = db.query(Event).filter(Event.id == 1).first()
if not event:
    print("Event 1 does not exist. Creating it...")
    event = Event(id=1, name="ACS Can Drive 2024", start_date="2024-01-01", end_date="2024-12-31")
    db.add(event)
    db.commit()
    print("Event 1 created successfully!")
else:
    print(f"Event 1 exists: {event.name}")

# Check students
students = db.query(Student).all()
print(f"Total students in database: {len(students)}")

# Check students with event_id = 1
students_event_1 = db.query(Student).filter(Student.event_id == 1).all()
print(f"Students with event_id = 1: {len(students_event_1)}")

# Check students with cans > 0
students_with_cans = db.query(Student).filter(Student.total_cans > 0).all()
print(f"Students with cans > 0: {len(students_with_cans)}")
for s in students_with_cans:
    print(f"  - {s.first_name} {s.last_name}: {s.total_cans} cans (event_id: {s.event_id})")

# If students exist but don't have event_id = 1, update them
if students and not students_event_1:
    print("Updating all students to have event_id = 1...")
    for student in students:
        student.event_id = 1
    db.commit()
    print("All students updated to event_id = 1")

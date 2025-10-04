from database import get_db
from models import Student, Event, Donation

db = next(get_db())

# Check if event 1 exists
event = db.query(Event).filter(Event.id == 1).first()
print(f"Event 1 exists: {event is not None}")
if event:
    print(f"Event name: {event.name}")

# Check students for event 1
students = db.query(Student).filter(Student.event_id == 1).all()
print(f"Students in event 1: {len(students)}")

# Check students with cans > 0
students_with_cans = db.query(Student).filter(Student.event_id == 1, Student.total_cans > 0).all()
print(f"Students with cans in event 1: {len(students_with_cans)}")
for s in students_with_cans:
    print(f"  - {s.first_name} {s.last_name}: {s.total_cans} cans")

# Check all events
all_events = db.query(Event).all()
print(f"\nAll events: {len(all_events)}")
for e in all_events:
    print(f"  - Event {e.id}: {e.name}")

# Check students in all events
all_students = db.query(Student).all()
print(f"\nTotal students: {len(all_students)}")
for s in all_students[:5]:  # Show first 5
    print(f"  - {s.first_name} {s.last_name}: Event {s.event_id}, Cans: {s.total_cans}")

from django.core.management.base import BaseCommand
from admin_interface.models import Teacher, Student, StudentTeacherAssociation, User, Role
from django.db import transaction

class Command(BaseCommand):
    help = 'Set up sample student-teacher associations for testing filtered messaging'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing associations before creating new ones',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing student-teacher associations...')
            StudentTeacherAssociation.objects.all().delete()

        with transaction.atomic():
            # Get all teachers and students
            teachers = Teacher.objects.all()
            students = Student.objects.all()

            if not teachers.exists():
                self.stdout.write(self.style.WARNING('No teachers found. Please create teachers first.'))
                return

            if not students.exists():
                self.stdout.write(self.style.WARNING('No students found. Please create students first.'))
                return

            created_count = 0
            
            # Strategy: Assign each teacher to a subset of students
            for i, teacher in enumerate(teachers):
                # Assign each teacher to about 3-5 students (cycling through students)
                start_idx = (i * 3) % len(students)
                end_idx = min(start_idx + 5, len(students))
                assigned_students = list(students)[start_idx:end_idx]
                
                # If we've gone past the end, wrap around
                if len(assigned_students) < 3 and len(students) > 3:
                    remaining = 3 - len(assigned_students)
                    assigned_students.extend(list(students)[:remaining])

                for j, student in enumerate(assigned_students):
                    # Make the first student assignment the primary teacher
                    is_primary = (j == 0)
                    
                    # Assign a subject (rotate through common subjects)
                    subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Physical Education']
                    subject = subjects[j % len(subjects)]
                    
                    association, created = StudentTeacherAssociation.objects.get_or_create(
                        student=student,
                        teacher=teacher,
                        subject=subject,
                        defaults={
                            'is_primary': is_primary,
                            'is_active': True
                        }
                    )
                    
                    if created:
                        created_count += 1
                        self.stdout.write(
                            f'✅ Associated {teacher.name} with {student.name} '
                            f'({subject}{"" if not is_primary else " - Primary"})'
                        )

            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created {created_count} student-teacher associations!'
                )
            )

            # Show summary
            total_associations = StudentTeacherAssociation.objects.count()
            teachers_with_students = Teacher.objects.filter(
                student_associations__isnull=False
            ).distinct().count()
            students_with_teachers = Student.objects.filter(
                teacher_associations__isnull=False
            ).distinct().count()

            self.stdout.write('\n📊 Summary:')
            self.stdout.write(f'   Total associations: {total_associations}')
            self.stdout.write(f'   Teachers with students: {teachers_with_students}/{teachers.count()}')
            self.stdout.write(f'   Students with teachers: {students_with_teachers}/{students.count()}')
            
            # Show some examples
            self.stdout.write('\n📝 Sample associations:')
            for association in StudentTeacherAssociation.objects.select_related('teacher', 'student')[:5]:
                primary_text = " (Primary)" if association.is_primary else ""
                self.stdout.write(
                    f'   {association.teacher.name} → {association.student.name} '
                    f'({association.subject}){primary_text}'
                ) 
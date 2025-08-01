# Generated manually to update user_count for existing departments

from django.db import migrations


def update_user_counts(apps, schema_editor):
    Department = apps.get_model('inventory', 'Department')
    for department in Department.objects.all():
        department.user_count = department.users.count()
        department.save(update_fields=['user_count'])


def reverse_update_user_counts(apps, schema_editor):
    Department = apps.get_model('inventory', 'Department')
    Department.objects.all().update(user_count=0)


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0012_department_deleted_at_department_is_deleted_and_more'),
    ]

    operations = [
        migrations.RunPython(update_user_counts, reverse_update_user_counts),
    ] 
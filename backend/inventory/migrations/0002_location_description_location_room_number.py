# Generated by Django 5.2.3 on 2025-06-21 11:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='location',
            name='description',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='location',
            name='room_number',
            field=models.CharField(default='0', max_length=100),
        ),
    ]

# Generated by Django 5.2.3 on 2025-06-22 16:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0003_remove_category_description_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='item_count',
            field=models.PositiveIntegerField(default=0),
        ),
    ]

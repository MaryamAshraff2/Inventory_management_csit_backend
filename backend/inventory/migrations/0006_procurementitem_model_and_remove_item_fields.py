from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0005_procurement_document_procurement_order_date_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='procurement',
            name='item',
        ),
        migrations.RemoveField(
            model_name='procurement',
            name='quantity',
        ),
        migrations.RemoveField(
            model_name='procurement',
            name='unit_price',
        ),
        migrations.CreateModel(
            name='ProcurementItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.PositiveIntegerField()),
                ('unit_price', models.DecimalField(max_digits=10, decimal_places=2)),
                ('item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='inventory.item')),
                ('procurement', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='inventory.procurement')),
            ],
        ),
    ] 
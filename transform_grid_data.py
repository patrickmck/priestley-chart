import json
# import numpy as np
import random
from pprint import pprint

with open('grid_data.json', 'r') as f:
    graphdata = json.load(f)

# The row is the most basic unit of geography; an area is
# a set of rows and/or areas. This function unbundles an
# area into its constituent rows.
def expand_node(area_name):
    if area_name in row_names:
        return [area_name]
    area_elements = graphdata['areas'].get(area_name)
    if area_elements is None:
        print(f"Not found: {area_name}")
        return None
    else:
        expanded = []
        for element in area_elements:
            if element in row_names:
                expanded.append(element)
            else:
                expanded.extend(expand_node(element))
        return expanded

# Stub function to check that no polygons overlap.
def check_tree():
    return True

# The final chart will resemble a grid where the rows are geographic
# entities and each column is one year. An empire (aka context) is a
# polygon whose edges align with the grid lines.
# 
#       start_year  start_year+1  ... end_year
# Row_1
# Row_2
# ...
# Row_N

start_year = 850
end_year = 1940

row_names = {
    r: k
    for k,r in enumerate(graphdata['rows'])
}

num_rows = len(row_names)
num_columns = end_year - start_year
print(num_rows)

# Construct a dictionary in which the keys are the context/empire names
# and the values are a list of [row_num, col_start, col_end] triples, in
# row order, e.g. {Mongol Empire: [Row2, 50, 150], [Row3, 60, 150], ...}
polygon_data = {}
for context in graphdata.get('contexts'):
    polygon_data[context] = []
    for timeline in graphdata['contexts'][context]:
        obj_name = timeline[0]
        # An object here may be a row or an area
        row_number = row_names.get(obj_name)
        obj_start = timeline[1]
        col_start = max(obj_start-start_year, 0)
        obj_end = timeline[2]
        if obj_end is None:
            obj_end = end_year
        col_end = min(num_columns-1, obj_end-start_year)

        # If the object is a row, it will appear in row_names ...
        if row_number is not None:
            polygon_data[context].append([row_number, col_start, col_end])
        # ... otherwise it must be an area. Decompose it into its rows.
        else:
            obj_rows = expand_node(obj_name)
            for obj_row in obj_rows:
                row_number = row_names.get(obj_row)
                polygon_data[context].append([row_number, col_start, col_end])
    polygon_data[context].sort()
# print(polygon_data)

# Each row looks like [row_num, col_start, col_end]. This method
# takes a list of such lists and returns a list of [x,y] coords.
def rows_to_points(context_subset, logging):
    point_list = []
    if logging:
        print("=====LOGGING=====")
        print([[c[0], c[1]+start_year, c[2]+start_year] for c in context_subset])
    
    corners = set()
    first_row = context_subset[0]
    for row, col_start, col_end in context_subset:
        top_left = (row, col_start)
        top_right = (row, col_end)
        bottom_left = (row + 1, col_start)
        bottom_right = (row + 1, col_end)

        if top_left in corners and top_left[0]!=first_row:
            corners.remove(top_left)
        else:
            corners.add(top_left)
        if top_right in corners and top_right[0]!=first_row:
            corners.remove(top_right)
        else:
            corners.add(top_right)
        
        corners.add(bottom_left)
        corners.add(bottom_right)

        if logging:
            print([(e[0],e[1]+start_year) for e in sorted(corners)])
    return [(e[1],e[0]) for e in sorted(corners)]

# The rows_to_points function assumes that its input cells are all contiguous.
# This function separates a context/empire into contiguous subsets which will
# become individual polygons in the final grid; it assumes that the list of
# [row_num, col_start, col_end] triples for each context is in row_num order.
polygon_points = []
for context in polygon_data.keys():
    logging = True if context=='New France' else False
    break_idx = 0
    # For each [row_num, col_start, col_end] triple belonging to the context
    for i in range(len(polygon_data[context])):
        # Break at the end of the list of triples
        if i==len(polygon_data[context])-1:
            context_subset = polygon_data[context][break_idx:i+1]
            point_list = rows_to_points(context_subset, logging)
            polygon_points.append({'name': context, 'points': point_list})
        # Break if the next row_num doesn't follow from the current one
        # elif polygon_data[context][i+1][0] not in [polygon_data[context][i][0]+1]:
        elif polygon_data[context][i+1][0] not in [polygon_data[context][i][0], polygon_data[context][i][0]+1]:
            context_subset = polygon_data[context][break_idx:i+1]
            point_list = rows_to_points(context_subset, logging)
            polygon_points.append({'name': context, 'points': point_list})
            break_idx = i+1
#         print(f"{context}\t{polygon_data[context][i]}")
# pprint(polygon_points)

def random_hex_color():
    return "#{:02x}{:02x}{:02x}".format(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))

colour_map = {
    context: random_hex_color()
    for context in graphdata.get('contexts')
}
colour_map.update({None: '#f1e2b3'})


output_dict = {
    'num_rows': num_rows,
    'num_cols': num_columns,
    'start_year': start_year,
    'end_year': end_year,
    'colours': colour_map,
    'row_numbers': {k: r for k,r in enumerate(graphdata['rows'])},
    'polydata': polygon_points
}

with open('./www/public/grid_contents.json', 'w') as f:
    json.dump(output_dict, f)
